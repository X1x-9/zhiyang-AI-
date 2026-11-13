import type { DashboardData, WeightPoint } from "./dashboard";

export type DemoMealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";
export type DemoMealStatus = "PENDING" | "CONFIRMED" | "REJECTED";
export type DemoMeal = {
  id: string;
  title: string;
  mealType: DemoMealType;
  items: Array<{ name: string; amountGrams: number; calories: number }>;
  estimatedKcal: number;
  status: DemoMealStatus;
  eatenAt: string;
  notes: string;
};

const TIME_ZONE = "Asia/Shanghai";

export function isDemoMode() {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function chinaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function chinaDateLabel(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}年${get("month")}月${get("day")}日 · ${get("weekday")}`;
}

export function chinaGreeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).format(date));
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function chinaDayRange(now = new Date()) {
  const key = chinaDateKey(now);
  const start = new Date(`${key}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, key };
}

export function chinaWeekStart(now = new Date()) {
  const { key } = chinaDayRange(now);
  const [year, month, day] = key.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (utcDate.getUTCDay() + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysSinceMonday);
  const mondayKey = utcDate.toISOString().slice(0, 10);
  return new Date(`${mondayKey}T00:00:00+08:00`);
}

export function lastSevenDayLabels(now = new Date()) {
  const { key } = chinaDayRange(now);
  const base = new Date(`${key}T12:00:00+08:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat("zh-CN", { timeZone: TIME_ZONE, weekday: "short" }).format(date);
  });
}

function todayAt(hour: number, minute: number) {
  const { key } = chinaDayRange();
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${key}T${hh}:${mm}:00+08:00`).toISOString();
}

const demoWeightValues = [64.0, 63.9, 63.8, 64.1, 63.7, 63.5, 63.4];

export function createDemoDashboard(notice?: string): DashboardData {
  const labels = lastSevenDayLabels();
  const weightSeries: WeightPoint[] = labels.map((label, index) => ({ label, kg: demoWeightValues[index] }));
  const todayAll = listDemoMeals();
  const todayMeals = todayAll.filter((meal) => meal.status === "CONFIRMED");
  const calories = todayMeals.reduce((sum, meal) => sum + meal.estimatedKcal, 0);
  return {
    demo: true,
    ...(notice ? { notice } : {}),
    dateLabel: chinaDateLabel(),
    greeting: chinaGreeting(),
    displayName: "林同学",
    calories,
    calorieGoal: 2250,
    macros:
      todayMeals.length === 4
        ? {
            protein: { consumed: 82, goal: 125 },
            carbs: { consumed: 150, goal: 230 },
            fat: { consumed: 52, goal: 74 },
          }
        : null,
    waterMl: 1100,
    waterGoal: 2000,
    weightKg: 63.4,
    weightChangeKg: -0.6,
    weightSeries,
    pendingMeals: todayAll.filter((meal) => meal.status === "PENDING").length,
    mealsToday: todayMeals.length,
    workout: {
      title: "全身基础力量 · 轻松开始",
      durationMinutes: 25,
      exercises: ["深蹲", "臀桥", "墙面俯卧撑"],
    },
    week: {
      recordedDays: 4,
      meals: 9,
      workouts: 2,
      weightEntries: 7,
      note: "本周有 3 天没有记录，复盘只按已有记录呈现，不补推缺失数据。",
    },
  };
}

function createDemoMeals(): DemoMeal[] {
  return [
    {
      id: "demo-breakfast",
      title: "燕麦酸奶碗",
      mealType: "BREAKFAST",
      items: [
        { name: "燕麦", amountGrams: 40, calories: 156 },
        { name: "无糖酸奶", amountGrams: 200, calories: 144 },
        { name: "蓝莓", amountGrams: 50, calories: 28 },
        { name: "奇亚籽", amountGrams: 10, calories: 49 },
        { name: "香蕉", amountGrams: 30, calories: 27 },
        { name: "蜂蜜", amountGrams: 5, calories: 16 },
      ],
      estimatedKcal: 420,
      status: "CONFIRMED",
      eatenAt: todayAt(8, 10),
      notes: "酸奶选无糖，燕麦一小碗。",
    },
    {
      id: "demo-lunch",
      title: "番茄鸡胸杂粮饭",
      mealType: "LUNCH",
      items: [
        { name: "杂粮饭", amountGrams: 150, calories: 174 },
        { name: "香煎鸡胸", amountGrams: 120, calories: 180 },
        { name: "清炒西兰花", amountGrams: 100, calories: 80 },
      ],
      estimatedKcal: 434,
      status: "CONFIRMED",
      eatenAt: todayAt(12, 30),
      notes: "米饭半碗，鸡胸肉少油。",
    },
    {
      id: "demo-snack",
      title: "无糖豆浆和坚果",
      mealType: "SNACK",
      items: [
        { name: "无糖豆浆", amountGrams: 300, calories: 93 },
        { name: "混合坚果", amountGrams: 20, calories: 130 },
        { name: "苹果", amountGrams: 100, calories: 52 },
        { name: "全麦饼干", amountGrams: 15, calories: 48 },
      ],
      estimatedKcal: 323,
      status: "CONFIRMED",
      eatenAt: todayAt(16, 0),
      notes: "下午加餐，坚果只抓了一小把。",
    },
    {
      id: "demo-dinner",
      title: "虾仁豆腐",
      mealType: "DINNER",
      items: [
        { name: "虾仁", amountGrams: 100, calories: 99 },
        { name: "嫩豆腐", amountGrams: 150, calories: 120 },
      ],
      estimatedKcal: 219,
      status: "CONFIRMED",
      eatenAt: todayAt(18, 40),
      notes: "",
    },
  ];
}

let demoMeals: DemoMeal[] = [];
let demoSeedDate = "";

function ensureDemoMeals() {
  const today = chinaDateKey();
  if (demoSeedDate !== today) {
    demoMeals = createDemoMeals();
    demoSeedDate = today;
  }
  return demoMeals;
}

export function listDemoMeals() {
  const today = chinaDateKey();
  return [...ensureDemoMeals()]
    .filter((meal) => chinaDateKey(new Date(meal.eatenAt)) === today)
    .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime());
}

export function addDemoMeal(input: {
  title: string;
  mealType?: DemoMealType;
  items: Array<{ name: string; amountGrams: number; calories: number }>;
  notes?: string;
  status?: DemoMealStatus;
  eatenAt?: string;
}) {
  const meals = ensureDemoMeals();
  const meal: DemoMeal = {
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    mealType: input.mealType ?? "OTHER",
    items: input.items,
    estimatedKcal: input.items.reduce((sum, item) => sum + item.calories, 0),
    status: input.status ?? "CONFIRMED",
    eatenAt: input.eatenAt ?? new Date().toISOString(),
    notes: input.notes ?? "",
  };
  meals.unshift(meal);
  return meal;
}

export function updateDemoMeal(
  id: string,
  patch: {
    title?: string;
    mealType?: DemoMealType;
    status?: DemoMealStatus;
    items?: Array<{ name: string; amountGrams: number; calories: number }>;
    notes?: string;
  },
) {
  const meals = ensureDemoMeals();
  const meal = meals.find((item) => item.id === id);
  if (!meal) return null;
  if (patch.title !== undefined) meal.title = patch.title;
  if (patch.mealType !== undefined) meal.mealType = patch.mealType;
  if (patch.status !== undefined) meal.status = patch.status;
  if (patch.items !== undefined) {
    meal.items = patch.items;
    meal.estimatedKcal = patch.items.reduce((sum, item) => sum + item.calories, 0);
  }
  if (patch.notes !== undefined) meal.notes = patch.notes;
  return meal;
}

export function deleteDemoMeal(id: string) {
  const meals = ensureDemoMeals();
  const index = meals.findIndex((item) => item.id === id);
  if (index === -1) return false;
  meals.splice(index, 1);
  return true;
}
