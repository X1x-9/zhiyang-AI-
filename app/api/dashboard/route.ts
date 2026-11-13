import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  chinaDateKey,
  chinaDateLabel,
  chinaDayRange,
  chinaGreeting,
  chinaWeekStart,
  createDemoDashboard,
  isDemoMode,
} from "@/lib/demo-data";
import type { WeekSummary } from "@/lib/dashboard";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(createDemoDashboard());
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "请先接入认证会话后访问个人健康数据。" },
      { status: 401 },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(createDemoDashboard("数据库未配置，当前展示演示数据。"));
  }

  try {
    const prisma = getPrisma();
    const profile = await prisma.healthProfile.upsert({
      where: { id: "demo-local" },
      create: { id: "demo-local" },
      update: {},
      select: { id: true, displayName: true },
    });

    const { start, end } = chinaDayRange();
    const weekStart = chinaWeekStart();
    const [todayMeals, pendingMeals, weekMeals] = await Promise.all([
      prisma.mealRecord.findMany({
        where: { profileId: profile.id, status: "CONFIRMED", eatenAt: { gte: start, lt: end } },
        select: { estimatedKcal: true },
      }),
      prisma.mealRecord.count({ where: { profileId: profile.id, status: "PENDING", eatenAt: { gte: start, lt: end } } }),
      prisma.mealRecord.findMany({
        where: { profileId: profile.id, status: "CONFIRMED", eatenAt: { gte: weekStart, lt: end } },
        select: { eatenAt: true, estimatedKcal: true },
      }),
    ]);

    const calories = todayMeals.reduce((sum, meal) => sum + (meal.estimatedKcal ?? 0), 0);
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
      displayName: profile.displayName,
      calories,
      calorieGoal: 2250,
      macros: null,
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
    console.error("DASHBOARD DB ERROR", error);
    return NextResponse.json(createDemoDashboard("数据库暂不可用，当前展示演示数据。"));
  }
}
