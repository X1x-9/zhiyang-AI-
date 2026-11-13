import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { addDemoMeal, chinaDayRange, isDemoMode, listDemoMeals } from "@/lib/demo-data";

const mealSchema = z.object({
  title: z.string().trim().min(1).max(100),
  items: z.array(z.object({ name: z.string().trim().min(1).max(80), amountGrams: z.number().min(0).max(3000), calories: z.number().min(0).max(5000) })).min(1).max(30),
  notes: z.string().max(1000).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED"]).optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]).optional(),
  eatenAt: z.string().datetime().optional(),
});

const errors = { OVERWEIGHT: "记录热量超过每日安全校验范围，请检查份量。", TOO_MANY_ITEMS: "单餐食材数量超出可处理范围。" } as const;

function demoMealsResponse(notice?: string) {
  return NextResponse.json({
    meals: listDemoMeals(),
    demo: true,
    ...(notice ? { notice } : {}),
  });
}

export async function GET() {
  if (isDemoMode()) return demoMealsResponse();
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  if (!process.env.DATABASE_URL) return demoMealsResponse("数据库未配置，当前展示演示记录。");
  try {
    const prisma = getPrisma();
    const profile = await prisma.healthProfile.upsert({ where: { id: "demo-local" }, create: { id: "demo-local" }, update: {} });
    const { start, end } = chinaDayRange();
    const meals = await prisma.mealRecord.findMany({
      where: { profileId: profile.id, status: { not: "REJECTED" }, eatenAt: { gte: start, lt: end } },
      orderBy: { eatenAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ meals, demo: false });
  } catch {
    return demoMealsResponse("数据库暂不可用，当前展示演示记录。");
  }
}

export async function POST(request: Request) {
  const demo = isDemoMode();
  const demoRequest = process.env.NODE_ENV !== "production" && request.headers.get("x-demo-mode") === "true";
  if (!demo && !demoRequest && process.env.NODE_ENV === "production") return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const useDemo = demo || demoRequest || !process.env.DATABASE_URL;
  const payload: unknown = await request.json().catch(() => null);
  const parsed = mealSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_MEAL", details: parsed.error.flatten() }, { status: 400 });
  const calories = parsed.data.items.reduce((sum, item) => sum + item.calories, 0);
  if (calories > 3000) return NextResponse.json({ error: "OVERWEIGHT", message: errors.OVERWEIGHT }, { status: 422 });
  if (useDemo) {
    const meal = addDemoMeal({
      title: parsed.data.title,
      mealType: parsed.data.mealType,
      items: parsed.data.items,
      notes: parsed.data.notes,
      status: parsed.data.status,
      eatenAt: parsed.data.eatenAt,
    });
    return NextResponse.json({ meal, demo: true }, { status: 201 });
  }
  try {
    const prisma = getPrisma();
    const profile = await prisma.healthProfile.upsert({ where: { id: "demo-local" }, create: { id: "demo-local" }, update: {} });
    const meal = await prisma.mealRecord.create({ data: { profileId: profile.id, title: parsed.data.title, mealType: parsed.data.mealType ?? "OTHER", eatenAt: parsed.data.eatenAt ? new Date(parsed.data.eatenAt) : new Date(), items: parsed.data.items, estimatedKcal: calories, lowerKcal: Math.round(calories * 0.85), upperKcal: Math.round(calories * 1.2), notes: parsed.data.notes ?? "", status: parsed.data.status ?? "PENDING" } });
    return NextResponse.json({ meal, demo: false }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
