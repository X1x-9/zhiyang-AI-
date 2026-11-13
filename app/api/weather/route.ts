import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/identity";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getWeather, isWeatherConfigured, WeatherError } from "@/lib/weather";

export async function GET(request: Request) {
  const limit = rateLimit(clientKey(request, "weather"), 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "天气刷新有点频繁，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const identity = await resolveIdentity();
    if (!identity) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "请先登录后再查看天气。" },
        { status: 401 },
      );
    }

    if (!isWeatherConfigured()) {
      return NextResponse.json(
        { error: "WEATHER_NOT_CONFIGURED", message: "天气服务还没有接入。" },
        { status: 503 },
      );
    }

    const city = new URL(request.url).searchParams.get("city")?.trim() ?? "";
    if (!city) {
      return NextResponse.json(
        { error: "CITY_REQUIRED", message: "还没有设置城市。" },
        { status: 400 },
      );
    }

    const snapshot = await getWeather(city);
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof WeatherError) {
      if (error.code === "NOT_CONFIGURED") {
        return NextResponse.json({ error: "WEATHER_NOT_CONFIGURED", message: error.message }, { status: 503 });
      }
      if (error.code === "INVALID_CITY" || error.code === "CITY_NOT_FOUND") {
        return NextResponse.json({ error: error.code, message: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: "WEATHER_UNAVAILABLE", message: error.message }, { status: 503 });
    }
    console.error("WEATHER ERROR", error);
    return NextResponse.json({ error: "WEATHER_UNAVAILABLE", message: "暂时取不到天气，请稍后再试。" }, { status: 503 });
  }
}
