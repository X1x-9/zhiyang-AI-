export type MacroProgress = { consumed: number; goal: number };
export type WeightPoint = { label: string; kg: number };
export type WorkoutSummary = { title: string; durationMinutes: number; exercises: string[] };
export type WeekDaySummary = {
  key: string;
  label: string;
  dateLabel: string;
  isToday: boolean;
  isFuture: boolean;
  meals: number;
  calories: number;
  workoutMinutes: number | null;
};

export type WeekSummary = {
  recordedDays: number;
  meals: number;
  workouts: number | null;
  weightEntries: number | null;
  note: string;
  days: WeekDaySummary[];
};

export type DashboardData = {
  demo: boolean;
  notice?: string;
  dateLabel: string;
  greeting: string;
  displayName: string;
  calories: number;
  calorieGoal: number;
  macros: {
    protein: MacroProgress;
    carbs: MacroProgress;
    fat: MacroProgress;
  } | null;
  waterMl: number;
  waterGoal: number;
  weightKg: number | null;
  weightChangeKg: number | null;
  weightSeries: WeightPoint[];
  pendingMeals: number;
  mealsToday: number;
  workout: WorkoutSummary | null;
  week: WeekSummary;
};

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? "暂时无法获取今日数据，请稍后重试。");
  }
  return response.json() as Promise<DashboardData>;
}
