import type { PlanDocument } from "./plan-engine";
import type { SpaceSession } from "./space";
import type { WeatherDay, WeatherSnapshot } from "./weather-types";

export type WeatherSeverity = "caution" | "severe";

export type WeatherSessionChange = {
  dayLabel: string;
  dateLabel: string;
  weather: string;
  weatherText: string;
  severity: WeatherSeverity;
  from: string;
  to: string;
  detail: string;
  change: string;
  blocked: boolean;
};

export type WeatherMovement = {
  city: string;
  scene: string;
  source: string;
  headline: string;
  summary: string;
  changes: WeatherSessionChange[];
  unchanged: string[];
  note: string;
};

export type WeatherMovementEvaluation =
  | { status: "SUGGESTED"; movement: WeatherMovement }
  | { status: "NONE"; reason: string };

const severePattern = /暴雨|雷暴|冰雹|大雪|暴雪|沙尘暴|强沙尘|台风/;
const cautionPattern = /雨|雪|雷|雾|霾|沙|尘/;
const outdoorTitles = new Set(["快走", "轻快走", "恢复日"]);
const weekdayChars = ["日", "一", "二", "三", "四", "五", "六"];
const dayPrefixes = ["今天", "明天", "后天"];

function windPower(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function weatherSeverity(day: WeatherDay): "none" | WeatherSeverity {
  const text = `${day.dayText} ${day.nightText}`;
  const power = Math.max(windPower(day.dayPower) ?? 0, windPower(day.nightPower) ?? 0);
  if (severePattern.test(text) || power >= 7
    || (day.dayTemp !== null && day.dayTemp >= 38)
    || (day.nightTemp !== null && day.nightTemp <= -12)) {
    return "severe";
  }
  if (cautionPattern.test(text) || power >= 5
    || (day.dayTemp !== null && day.dayTemp >= 35)
    || (day.nightTemp !== null && day.nightTemp <= -5)) {
    return "caution";
  }
  return "none";
}

function weekdayOf(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const weekday = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).getUTCDay();
  return {
    label: `周${weekdayChars[weekday]}`,
    monthDay: `${Number(match[2])}月${Number(match[3])}日`,
  };
}

function weatherTemps(day: WeatherDay) {
  if (day.nightTemp === null || day.dayTemp === null) return "";
  return `${Math.round(day.nightTemp)}–${Math.round(day.dayTemp)}℃`;
}

function weatherText(day: WeatherDay) {
  if (!day.dayText || day.dayText === "—") return day.nightText && day.nightText !== "—" ? day.nightText : "天气暂缺";
  if (!day.nightText || day.nightText === "—" || day.nightText === day.dayText) return day.dayText;
  return `${day.dayText}转${day.nightText}`;
}

function weatherLine(day: WeatherDay) {
  return [weatherText(day), weatherTemps(day)].filter(Boolean).join(" ");
}

function replacementFor(session: SpaceSession, severity: WeatherSeverity) {
  if (session.title === "恢复日") {
    return {
      title: "活动度",
      detail: "把户外散步改成室内拉伸，时间和强度都不加码。",
      change: "改室内",
      minutes: session.minutes,
      blocked: false,
    };
  }
  if (severity === "severe") {
    return {
      title: "室内有氧",
      detail: "天气不适合户外，缩到 20 分钟内，以呼吸顺畅为准。",
      change: "改室内并缩短",
      minutes: Math.min(session.minutes, 20),
      blocked: true,
    };
  }
  return {
    title: "室内有氧",
    detail: "雨雪或雾霾天改成室内有氧，时间不变。",
    change: "改室内",
    minutes: session.minutes,
    blocked: false,
  };
}

export function evaluateWeatherMovement(
  plan: PlanDocument,
  snapshot: WeatherSnapshot,
  now = new Date(),
): WeatherMovementEvaluation {
  if (plan.movement.sessionCount === 0) {
    return { status: "NONE", reason: "计划里还没有训练安排，先在「我的空间」补全训练节奏。" };
  }
  if (snapshot.days.length === 0) {
    return { status: "NONE", reason: "天气服务暂时没有预报数据，先按原计划训练。" };
  }

  const week = new Map(plan.movement.week.map((item) => [item.label, item.session] as const));
  const days = snapshot.days.slice(0, 3);
  const changes: WeatherSessionChange[] = [];
  const unchanged: string[] = [];
  const segments: string[] = [];

  days.forEach((day, index) => {
    segments.push(`${dayPrefixes[index] ?? ""} ${weatherLine(day)}`.trim());
    const when = weekdayOf(day.date);
    if (!when) return;
    const session = week.get(when.label) ?? null;
    if (!session) return;
    const severity = weatherSeverity(day);
    const whenLabel = `${dayPrefixes[index] ?? ""}（${when.label}）`;
    if (severity === "none") {
      unchanged.push(`${whenLabel}${when.monthDay}天气适合按原计划做${session.title}。`);
      return;
    }
    if (!outdoorTitles.has(session.title)) {
      unchanged.push(`${whenLabel}${session.title}在室内，不受天气影响。`);
      return;
    }
    const next = replacementFor(session, severity);
    changes.push({
      dayLabel: `${dayPrefixes[index] ?? ""} · ${when.label}`,
      dateLabel: when.monthDay,
      weather: weatherLine(day),
      weatherText: weatherText(day),
      severity,
      from: `${session.title} · ${session.minutes} 分钟`,
      to: `${next.title} · ${next.minutes} 分钟`,
      detail: next.detail,
      change: next.change,
      blocked: next.blocked,
    });
  });

  if (changes.length === 0) {
    return { status: "NONE", reason: "未来三天没有需要因天气调整的户外训练，先按原计划进行。" };
  }

  const city = snapshot.city || "所在城市";
  const first = changes[0];
  const fromTitle = first.from.split(" · ")[0];
  const toTitle = first.to.split(" · ")[0];
  const headline = changes.length === 1
    ? `${first.dayLabel}${first.weatherText}，${fromTitle}改${toTitle}`
    : `未来三天有${first.weatherText}，${changes.length} 次户外训练改到室内`;
  const blockedCount = changes.filter((change) => change.blocked).length;
  const summary = `${city}未来三天：${segments.join(" / ")}。${changes.length} 次户外训练改到室内，时长和训练目标基本不变${blockedCount > 0 ? "；其中明显不适合户外的已缩短时长" : ""}。`;

  return {
    status: "SUGGESTED",
    movement: {
      city,
      scene: segments.join(" / "),
      source: `高德天气 · ${snapshot.now.reportTime.slice(5, 16) || "刚刚"} 更新${snapshot.stale ? "（缓存）" : ""}`,
      headline,
      summary,
      changes,
      unchanged,
      note: "预报会变化，出门前再看一次；雷电、积水、高温或空气很差时取消户外安排。室内训练保持通风，强度以能正常说话为准。",
    },
  };
}

export function sameWeatherMovement(a: unknown, b: unknown) {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
