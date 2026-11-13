import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  chinaDateKey,
  chinaDateLabel,
  chinaDayRange,
  chinaGreeting,
  chinaWeekStart,
  createDemoDashboard,
} from "@/lib/demo-data";
import { IdentityError, resolveIdentity } from "@/lib/identity";
import { deriveNutritionTargets } from "@/lib/nutrition-goal";
import { loadProfile } from "@/lib/profile-store";
import type { WeekSummary } from "@/lib/dashboard";

export async function GET() {
  try {
    const identity = await resolveIdentity();
    if (!identity) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "请先登录后再访问个人健康数据。" },
        { status: 401 },
      );
    }

    if (identity.kind === "demo") {
      return NextResponse.json(createDemoDashboard(identity.sessionId));
    }

    const prisma = getPrisma();
    const profile = await loadProfile(identity);
    const targets = deriveNutritionTargets(profile);

    const { start, end } = chinaDayRange();
    const weekStart = chinaWeekStart();
    const [todayMeals, pendingMeals, weekMeals] = await Promise.all([
      prisma.mealRecord.findMany({
        where: { profileId: identity.profileId, status: "CONFIRMED", eatenAt: { gte: start, lt: end } },
        select: { estimatedKcal: true, proteinG: true, carbsG: true, fatG: true },
      }),
      prisma.mealRecord.count({ where: { profileId: identity.profileId, status: "PENDING", eatenAt: { gte: start, lt: end } } }),
      prisma.mealRecord.findMany({
        where: { profileId: identity.profileId, status: "CONFIRMED", eatenAt: { gte: weekStart, lt: end } },
        select: { eatenAt: true, estimatedKcal: true },
      }),
    ]);

    const calories = todayMeals.reduce((sum, meal) => sum + (meal.estimatedKcal ?? 0), 0);
    const macroMeals = todayMeals.filter((meal) => meal.proteinG !== null && meal.carbsG !== null && meal.fatG !== null);
    const macros = macroMeals.length > 0
      ? {
          protein: {
            consumed: Math.round(macroMeals.reduce((sum, meal) => sum + (meal.proteinG ?? 0), 0)),
            goal: targets.proteinGoal,
          },
          carbs: {
            consumed: Math.round(macroMeals.reduce((sum, meal) => sum + (meal.carbsG ?? 0), 0)),
            goal: targets.carbsGoal,
          },
          fat: {
            consumed: Math.round(macroMeals.reduce((sum, meal) => sum + (meal.fatG ?? 0), 0)),
            goal: targets.fatGoal,
          },
          partial: macroMeals.length < todayMeals.length,
        }
      : null;

    const todayKey = chinaDateKey();
    const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const weekDays = weekdays.map((label, index) => {
      const key = chinaDateKey(new Date(weekStart.getTime() + index * 86_400_000));
      const [, month, day] = key.split("-");
      const dayMeals = weekMeals.filter((meal) => chinaDateKey(meal.eatenAt) === key);
      return {
        key,
        label,
        dateLabel: `${Number(month)}/${Number(day)}`,
        isToday: key === todayKey,
        isFuture: key > todayKey,
        meals: dayMeals.length,
        calories: dayMeals.reduce((sum, meal) => sum + (meal.estimatedKcal ?? 0), 0),
        workoutMinutes: null,
      };
    });
    const recordedDays = weekDays.filter((day) => day.meals > 0).length;
    const week: WeekSummary = {
      recordedDays,
      meals: weekMeals.length,
      workouts: null,
      weightEntries: null,
      note:
        recordedDays >= 4
          ? "训练和体重记录尚未接入，本次复盘只展示饮食记录。"
          : `本周只有 ${recordedDays} 天饮食记录，暂不对执行情况作评价。`,
      days: weekDays,
    };

    return NextResponse.json({
      demo: false,
      dateLabel: chinaDateLabel(),
      greeting: chinaGreeting(),
      displayName: profile?.name.trim() || identity.displayName,
      calories,
      calorieGoal: targets.calorieGoal,
      macros,
      waterMl: 0,
      waterGoal: 2000,
      weightKg: null,
      weightChangeKg: null,
      weightSeries: [],
      pendingMeals,
      mealsToday: todayMeals.length,
      workout: null,
      week,
    });
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE", message: "数据服务暂时不可用，请稍后重试。" }, { status: 503 });
    }
    console.error("DASHBOARD ERROR", error);
    return NextResponse.json({ error: "DASHBOARD_UNAVAILABLE", message: "暂时无法整理今日数据，请稍后重试。" }, { status: 503 });
  }
}
