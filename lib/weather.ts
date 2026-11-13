import type { WeatherDay, WeatherSnapshot } from "./weather-types";

export type WeatherErrorCode = "NOT_CONFIGURED" | "INVALID_CITY" | "CITY_NOT_FOUND" | "UPSTREAM";

export class WeatherError extends Error {
  constructor(public code: WeatherErrorCode, message: string) {
    super(message);
    this.name = "WeatherError";
  }
}

type AmapEnvelope = {
  status?: string;
  info?: string;
  infocode?: string;
};

type AmapGeocode = AmapEnvelope & {
  geocodes?: Array<{ adcode?: string; city?: string | string[]; province?: string; district?: string }>;
};

type AmapDistrict = AmapEnvelope & {
  districts?: Array<{ adcode?: string; name?: string }>;
};

type AmapLive = AmapEnvelope & {
  lives?: Array<{
    province?: string;
    city?: string;
    adcode?: string;
    weather?: string;
    temperature?: string;
    winddirection?: string;
    windpower?: string;
    humidity?: string;
    reporttime?: string;
  }>;
};

type AmapForecast = AmapEnvelope & {
  forecasts?: Array<{
    city?: string;
    province?: string;
    adcode?: string;
    casts?: Array<{
      date?: string;
      week?: string;
      dayweather?: string;
      nightweather?: string;
      daytemp?: string;
      nighttemp?: string;
      daywind?: string;
      nightwind?: string;
      daypower?: string;
      nightpower?: string;
    }>;
  }>;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;
const ADCODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 120;

type WeatherCacheEntry = { expiresAt: number; snapshot: WeatherSnapshot };
type AdcodeCacheEntry = { expiresAt: number; adcode: string | null; city: string; province: string };

const globalForWeather = globalThis as unknown as {
  __zyWeather?: {
    weather: Map<string, WeatherCacheEntry>;
    adcode: Map<string, AdcodeCacheEntry>;
  };
};

function cacheStore() {
  if (!globalForWeather.__zyWeather) {
    globalForWeather.__zyWeather = { weather: new Map(), adcode: new Map() };
  }
  return globalForWeather.__zyWeather;
}

function trimCache<T>(map: Map<string, T>) {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const overflow = map.size - MAX_CACHE_ENTRIES;
  let removed = 0;
  for (const key of map.keys()) {
    map.delete(key);
    if (++removed >= overflow) break;
  }
}

function apiKey() {
  const key = process.env.AMAP_API_KEY?.trim();
  if (!key) {
    throw new WeatherError("NOT_CONFIGURED", "天气服务还没有接入。");
  }
  return key;
}

function toNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: string | string[] | undefined, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (Array.isArray(value)) return value.filter(Boolean).join("") || fallback;
  return fallback;
}

async function amap<T extends AmapEnvelope>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://restapi.amap.com/v3/${path}`);
  url.searchParams.set("key", apiKey());
  url.searchParams.set("output", "JSON");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  } catch (error) {
    console.error("AMAP FETCH ERROR", error instanceof Error ? error.name : "unknown");
    throw new WeatherError("UPSTREAM", "天气服务暂时没有响应。");
  }
  if (!response.ok) {
    throw new WeatherError("UPSTREAM", "天气服务暂时没有响应。");
  }
  const json = (await response.json()) as T;
  if (json.status !== "1") {
    console.error("AMAP RESPONSE ERROR", json.infocode ?? "", json.info ?? "");
    throw new WeatherError("UPSTREAM", "天气服务暂时没有返回数据。");
  }
  return json;
}

async function resolveAdcode(rawCity: string) {
  const city = rawCity.replace(/\s+/g, "").slice(0, 24);
  if (!city) {
    throw new WeatherError("INVALID_CITY", "还没有设置城市。");
  }
  if (/^\d{6}$/.test(city)) {
    return { adcode: city, city, province: "" };
  }

  const { adcode: adcodeCache } = cacheStore();
  const cached = adcodeCache.get(city);
  if (cached && cached.expiresAt > Date.now() && cached.adcode) {
    return { adcode: cached.adcode, city: cached.city, province: cached.province };
  }

  const geo = await amap<AmapGeocode>("geocode/geo", { address: city });
  const geocode = geo.geocodes?.find((item) => Boolean(item.adcode));
  if (geocode?.adcode) {
    const resolved = {
      adcode: geocode.adcode,
      city: text(geocode.city, text(geocode.district, city)),
      province: text(geocode.province),
    };
    adcodeCache.set(city, { expiresAt: Date.now() + ADCODE_TTL_MS, ...resolved });
    trimCache(adcodeCache);
    return resolved;
  }

  const district = await amap<AmapDistrict>("config/district", { keywords: city, subdistrict: "0" });
  const match = district.districts?.find((item) => item.adcode && item.name);
  if (match?.adcode) {
    const resolved = { adcode: match.adcode, city: match.name ?? city, province: "" };
    adcodeCache.set(city, { expiresAt: Date.now() + ADCODE_TTL_MS, ...resolved });
    trimCache(adcodeCache);
    return resolved;
  }

  throw new WeatherError("CITY_NOT_FOUND", "没有找到这个城市，换个写法试试。");
}

async function fetchSnapshot(adcode: string, resolvedCity: string, province: string): Promise<WeatherSnapshot> {
  const [liveResult, forecastResult] = await Promise.all([
    amap<AmapLive>("weather/weatherInfo", { city: adcode, extensions: "base" }),
    amap<AmapForecast>("weather/weatherInfo", { city: adcode, extensions: "all" }),
  ]);

  const live = liveResult.lives?.[0];
  const forecast = forecastResult.forecasts?.[0];
  const casts = forecast?.casts ?? [];
  if (!live || casts.length === 0) {
    throw new WeatherError("UPSTREAM", "天气服务暂时没有返回数据。");
  }

  const days: WeatherDay[] = casts.map((cast) => ({
    date: text(cast.date),
    week: text(cast.week),
    dayText: text(cast.dayweather, "—"),
    nightText: text(cast.nightweather, "—"),
    dayTemp: toNumber(cast.daytemp),
    nightTemp: toNumber(cast.nighttemp),
    dayWind: text(cast.daywind),
    nightWind: text(cast.nightwind),
    dayPower: text(cast.daypower),
    nightPower: text(cast.nightpower),
  }));

  return {
    city: resolvedCity || text(forecast?.city, text(live.city, adcode)),
    province: province || text(forecast?.province, text(live.province)),
    adcode,
    now: {
      text: text(live.weather, "—"),
      temperature: toNumber(live.temperature),
      humidity: toNumber(live.humidity),
      windDirection: text(live.winddirection),
      windPower: text(live.windpower),
      reportTime: text(live.reporttime),
    },
    days,
    fetchedAt: Date.now(),
    stale: false,
  };
}

export function isWeatherConfigured() {
  return Boolean(process.env.AMAP_API_KEY?.trim());
}

export async function getWeather(rawCity: string): Promise<WeatherSnapshot> {
  const { adcode, city, province } = await resolveAdcode(rawCity);

  const { weather: weatherCache } = cacheStore();
  const cached = weatherCache.get(adcode);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.snapshot;
  }

  try {
    const snapshot = await fetchSnapshot(adcode, city, province);
    weatherCache.set(adcode, { expiresAt: now + CACHE_TTL_MS, snapshot });
    trimCache(weatherCache);
    return snapshot;
  } catch (error) {
    if (cached && now - cached.snapshot.fetchedAt < STALE_TTL_MS) {
      return { ...cached.snapshot, stale: true };
    }
    throw error;
  }
}
