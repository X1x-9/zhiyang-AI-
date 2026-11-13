"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw } from "lucide-react";
import { getWeather } from "@/lib/dashboard";
import type { WeatherDay, WeatherSnapshot } from "@/lib/weather-types";

type WeatherCardProps = {
  city: string;
  onProfile: () => void;
};

type Tone = "clear" | "cloud" | "rain" | "snow" | "fog";

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function sceneTone(text: string): Tone {
  if (/雪|冰|冻/.test(text)) return "snow";
  if (/雨|雷|暴/.test(text)) return "rain";
  if (/雾|霾|沙|尘/.test(text)) return "fog";
  if (/云|阴/.test(text)) return "cloud";
  return "clear";
}

function isNight(reportTime: string) {
  const hour = Number(reportTime.slice(11, 13));
  return Number.isFinite(hour) && (hour >= 19 || hour < 6);
}

function dayLabel(day: WeatherDay, index: number) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  if (index === 2) return "后天";
  const week = Number(day.week);
  if (week >= 1 && week <= 7) return weekdayLabels[week % 7];
  const date = new Date(`${day.date}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : weekdayLabels[date.getDay()];
}

function formatTemp(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}°`;
}

function stampOf(snapshot: WeatherSnapshot) {
  const time = snapshot.now.reportTime.slice(11, 16);
  return `${time || "刚刚"} 更新${snapshot.stale ? " · 缓存" : ""}`;
}

function useMediaQuery(query: string) {
  const subscribe = React.useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function WeatherScene({ tone, night }: { tone: Tone; night: boolean }) {
  return (
    <svg
      className={`wx-scene wx-tone-${tone}${night ? " is-night" : ""}`}
      viewBox="0 0 96 74"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="wx-glow" cx="64" cy="26" r="18" />
      {night ? (
        <g className="wx-moon">
          <path d="M70.5 12.5a12 12 0 1 0 9.8 20.2 13.4 13.4 0 0 1-9.8-20.2Z" />
          <g className="wx-stars">
            <circle cx="38" cy="16" r="1.4" />
            <circle cx="27" cy="30" r="1" />
            <circle cx="47" cy="31" r=".9" />
          </g>
        </g>
      ) : (
        <g className="wx-sun">
          <g className="wx-rays">
            {Array.from({ length: 8 }, (_, index) => {
              const angle = (Math.PI / 4) * index;
              return (
                <line
                  key={index}
                  x1={64 + Math.cos(angle) * 14.5}
                  y1={26 + Math.sin(angle) * 14.5}
                  x2={64 + Math.cos(angle) * 19.5}
                  y2={26 + Math.sin(angle) * 19.5}
                />
              );
            })}
          </g>
          <circle cx="64" cy="26" r="10.5" />
        </g>
      )}
      {tone !== "clear" && (
        <g className="wx-cloud">
          <circle cx="36" cy="47" r="9.5" />
          <circle cx="51" cy="40" r="13" />
          <circle cx="65" cy="48" r="8.5" />
          <rect x="31" y="46" width="42" height="14" rx="7" />
        </g>
      )}
      {tone === "rain" && (
        <g className="wx-rain">
          <line x1="40" y1="62" x2="38.5" y2="68" />
          <line x1="52" y1="62" x2="50.5" y2="68" />
          <line x1="64" y1="62" x2="62.5" y2="68" />
        </g>
      )}
      {tone === "snow" && (
        <g className="wx-snow">
          <circle cx="40" cy="65" r="1.6" />
          <circle cx="52" cy="63" r="1.4" />
          <circle cx="64" cy="66" r="1.5" />
        </g>
      )}
      {tone === "fog" && (
        <g className="wx-fog">
          <rect x="26" y="58" width="44" height="3" rx="1.5" />
          <rect x="34" y="65" width="34" height="3" rx="1.5" />
        </g>
      )}
    </svg>
  );
}

function WeatherFace({ snapshot, stamp }: { snapshot: WeatherSnapshot; stamp: string }) {
  const now = snapshot.now;
  return (
    <>
      <div className="wx-head">
        <span className="wx-city">{snapshot.city}</span>
        <span className="wx-today">今天</span>
        <span className="wx-stamp">{stamp}</span>
      </div>
      <WeatherScene tone={sceneTone(now.text)} night={isNight(now.reportTime)} />
      <div className="wx-now">
        <div className="wx-reading">
          <strong>{formatTemp(now.temperature)}</strong>
          <span>{now.text}</span>
        </div>
        <p className="wx-meta">
          <span>{now.humidity === null ? "湿度暂缺" : `${now.humidity}% 湿度`}</span>
          {now.windDirection ? <span className="wx-wind"> · {now.windDirection}风 {now.windPower}级</span> : null}
        </p>
      </div>
    </>
  );
}

function WeatherPanel({ snapshot, id }: { snapshot: WeatherSnapshot; id: string }) {
  const forecast = snapshot.days.slice(1, 4);
  const now = snapshot.now;
  return (
    <div className="wx-panel" id={id}>
      <div className="wx-panel-inner">
        {forecast.length > 0 && (
          <>
            <p className="wx-panel-title">未来三天</p>
            <ul className="wx-days" aria-label="未来三天预报">
              {forecast.map((day, index) => (
                <li key={day.date}>
                  <span>{dayLabel(day, index + 1)}</span>
                  <em>{day.dayText || "—"}</em>
                  <b>{formatTemp(day.dayTemp)}<i>/{formatTemp(day.nightTemp)}</i></b>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="wx-panel-meta">
          {now.humidity === null ? "" : `${now.humidity}% 湿度 · `}
          {now.windDirection}风 {now.windPower}级 · {stampOf(snapshot)}
        </p>
      </div>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="wx-skeleton" role="status" aria-label="天气加载中">
      <span className="wx-sk-icon" />
      <span className="wx-sk-line" />
      <span className="wx-sk-line is-short" />
    </div>
  );
}

function WeatherEmpty({ error, onProfile, onRetry }: { error?: boolean; onProfile: () => void; onRetry?: () => void }) {
  return (
    <div className="wx-empty">
      <span className="wx-empty-icon" aria-hidden="true">
        {error ? <RefreshCw size={14} /> : <MapPin size={14} />}
      </span>
      <p>{error ? "天气暂时取不到" : "设置城市后显示天气"}</p>
      {error ? (
        <button type="button" onClick={onRetry}>重试</button>
      ) : (
        <button type="button" onClick={onProfile}>去设置</button>
      )}
    </div>
  );
}

export function WeatherCard({ city, onProfile }: WeatherCardProps) {
  const rail = useMediaQuery("(min-width: 1600px)");
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const cityName = city.trim();
  const query = useQuery({
    queryKey: ["weather", cityName],
    queryFn: () => getWeather(cityName),
    enabled: Boolean(cityName),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const snapshot = query.data;
  const state = !cityName
    ? "empty"
    : query.isPending
      ? "loading"
      : query.isError || !snapshot
        ? "error"
        : "ready";

  const face = state === "ready" && snapshot ? (
    <WeatherFace snapshot={snapshot} stamp={stampOf(snapshot)} />
  ) : state === "loading" ? (
    <WeatherSkeleton />
  ) : state === "error" ? (
    <WeatherEmpty error onProfile={onProfile} onRetry={() => void query.refetch()} />
  ) : (
    <WeatherEmpty onProfile={onProfile} />
  );

  if (rail) {
    return (
      <aside
        className={`wx-rail wx-state-${state}`}
        aria-label={snapshot ? `${snapshot.city}实时天气` : "实时天气"}
        data-open={open ? "true" : undefined}
      >
        {state === "ready" && snapshot ? (
          <button
            type="button"
            className="wx-face"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${snapshot.city}，${snapshot.now.text}，${snapshot.now.temperature ?? "—"} 度。查看未来三天天气`}
          >
            {face}
          </button>
        ) : (
          <div className="wx-face">{face}</div>
        )}
        {state === "ready" && snapshot && <WeatherPanel snapshot={snapshot} id={panelId} />}
      </aside>
    );
  }

  return (
    <aside className={`wx-strip wx-state-${state}`} aria-label={snapshot ? `${snapshot.city}实时天气` : "实时天气"}>
      <div className="wx-face">{face}</div>
      {state === "ready" && snapshot && <WeatherPanel snapshot={snapshot} id={panelId} />}
    </aside>
  );
}
