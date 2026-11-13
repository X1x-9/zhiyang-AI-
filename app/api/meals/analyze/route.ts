import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeMeal, parseDataUrl } from "@/lib/meal-vision";
import { isVisionConfigured } from "@/lib/ai-tools";
import { isDemoMode } from "@/lib/demo-data";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const bodySchema = z.object({
  image: z.string().min(64).max(8_000_000),
  note: z.string().max(1000).optional().default(""),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !isDemoMode()) {
    return NextResponse.json({ error: "AUTH_REQUIRED", message: "正式环境需要认证与限流后再开放图片识别。" }, { status: 401 });
  }
  if (!isVisionConfigured()) {
    return NextResponse.json({ error: "MODEL_NOT_CONFIGURED", message: "当前环境还没有配置视觉模型，照片识别暂不可用。" }, { status: 503 });
  }
  const limited = rateLimit(clientKey(request, "analyze"), 6, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "识别请求有点频繁，请稍等片刻再试。" }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", message: "图片或说明格式不正确。" }, { status: 400 });
  }

  let image;
  try {
    image = parseDataUrl(parsed.data.image);
  } catch (error) {
    return NextResponse.json({ error: "INVALID_IMAGE", message: error instanceof Error ? error.message : "图片无效。" }, { status: 400 });
  }

  try {
    const analysis = await analyzeMeal(image, parsed.data.note);
    return NextResponse.json({ analysis });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("MEAL VISION ERROR", detail);
    const visionEmpty = /图片描述|No output|No object|IMAGE|length/i.test(detail);
    return NextResponse.json(
      {
        error: "VISION_UNAVAILABLE",
        message: visionEmpty
          ? "视觉模型这次没有给出可用的图片描述，请重试，或在补充说明里写清食物名称。"
          : "识别失败，请稍后重试。",
      },
      { status: 502 },
    );
  }
}
