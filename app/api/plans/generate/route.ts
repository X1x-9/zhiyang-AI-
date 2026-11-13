import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/demo-data";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { generatePlanVersion } from "@/lib/plan-store";
import { normalizeSpaceProfile, validateSpaceProfile } from "@/lib/space";

const bodySchema = z.object({ profile: z.unknown() });

export async function POST(request: Request) {
  if (!isDemoMode() && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }
  const limited = rateLimit(clientKey(request, "plans-generate"), 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "生成请求有点频繁，请稍等片刻再试。" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_BODY", message: "没有收到可用的资料。" }, { status: 400 });

  const profile = normalizeSpaceProfile(parsed.data.profile);
  if (!profile) return NextResponse.json({ error: "INVALID_PROFILE", message: "资料格式无法识别，请回到资料页重新保存。" }, { status: 400 });

  const errors = validateSpaceProfile(profile);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "INVALID_PROFILE", message: "资料里还有需要修正的字段，修好后再生成。", errors }, { status: 422 });
  }

  const result = await generatePlanVersion(profile);
  return NextResponse.json(result, { status: 201 });
}