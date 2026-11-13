import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { deleteDemoMeal, isDemoMode, updateDemoMeal } from "@/lib/demo-data";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED"]).optional(),
  items: z.array(z.object({ name: z.string().trim().min(1).max(80), amountGrams: z.number().min(0).max(3000), calories: z.number().min(0).max(5000) })).min(1).max(30).optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const demo = isDemoMode();
  const demoRequest = process.env.NODE_ENV !== "production" && request.headers.get("x-demo-mode") === "true";
  if (!demo && !demoRequest && process.env.NODE_ENV === "production") return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const useDemo = demo || demoRequest || !process.env.DATABASE_URL || id.startsWith("demo-");
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_MEAL", details: parsed.error.flatten() }, { status: 400 });
  const calories = parsed.data.items ? parsed.data.items.reduce((sum, item) => sum + item.calories, 0) : undefined;
  if (calories !== undefined && calories > 3000) return NextResponse.json({ error: "OVERWEIGHT", message: "记录热量超过每日安全校验范围，请检查份量。" }, { status: 422 });
  if (useDemo) {
    const meal = updateDemoMeal(id, parsed.data);
    if (!meal) return NextResponse.json({ error: "NOT_FOUND", message: "没有找到这条演示记录。" }, { status: 404 });
    return NextResponse.json({ meal, demo: true });
  }
  try {
    const prisma = getPrisma();
    const meal = await prisma.mealRecord.update({
      where: { id },
      data: {
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.mealType ? { mealType: parsed.data.mealType } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.items ? { items: parsed.data.items, estimatedKcal: calories, lowerKcal: Math.round((calories ?? 0) * 0.85), upperKcal: Math.round((calories ?? 0) * 1.2) } : {}),
      },
    });
    return NextResponse.json({ meal, demo: false });
  } catch {
    return NextResponse.json({ error: "UPDATE_FAILED", message: "未能更新这条记录，请稍后重试。" }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const demo = isDemoMode();
  const demoRequest = process.env.NODE_ENV !== "production" && request.headers.get("x-demo-mode") === "true";
  if (!demo && !demoRequest && process.env.NODE_ENV === "production") return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const useDemo = demo || demoRequest || !process.env.DATABASE_URL || id.startsWith("demo-");
  if (useDemo) {
    if (!deleteDemoMeal(id)) return NextResponse.json({ error: "NOT_FOUND", message: "没有找到这条演示记录。" }, { status: 404 });
    return NextResponse.json({ ok: true, demo: true });
  }
  try {
    const prisma = getPrisma();
    await prisma.mealRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true, demo: false });
  } catch {
    return NextResponse.json({ error: "DELETE_FAILED", message: "未能删除这条记录。" }, { status: 502 });
  }
}
