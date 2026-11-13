export type WeatherNow = {
  text: string;
  temperature: number | null;
  humidity: number | null;
  windDirection: string;
  windPower: string;
  reportTime: string;
};

export type WeatherDay = {
  date: string;
  week: string;
  dayText: string;
  nightText: string;
  dayTemp: number | null;
  nightTemp: number | null;
  dayWind: string;
  nightWind: string;
  dayPower: string;
  nightPower: string;
};

export type WeatherSnapshot = {
  city: string;
  province: string;
  adcode: string;
  now: WeatherNow;
  days: WeatherDay[];
  fetchedAt: number;
  stale: boolean;
};
