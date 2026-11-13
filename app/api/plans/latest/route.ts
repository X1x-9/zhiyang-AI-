import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-data";
import { getLatestPlan } from "@/lib/plan-store";

export async function GET(request: Request) {
  if (!isDemoMode() && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }
  const fingerprint = new URL(request.url).searchParams.get("fingerprint")?.trim() ?? "";
  if (!/^p[a-z0-9]{1,16}$/.test(fingerprint)) {
    return NextResponse.json({ error: "INVALID_FINGERPRINT", message: "资料标识无效。" }, { status: 400 });
  }
  const result = await getLatestPlan(fingerprint);
  return NextResponse.json({
    plan: result?.plan ?? null,
    persisted: result?.persisted ?? false,
    demo: isDemoMode(),
  });
}