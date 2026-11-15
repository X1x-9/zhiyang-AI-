import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveIdentity } from "@/lib/identity";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const DEFAULT_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

const inputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  voice: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._-]+$/).optional(),
});

function failure(status: number, error: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ error, message }, { status, headers });
}

export async function POST(request: Request) {
  try {
    const identity = await resolveIdentity();
    if (!identity) {
      return failure(401, "AUTH_REQUIRED", "请先登录后再使用朗读。");
    }
    const scope = identity.kind === "user" ? identity.userId : identity.sessionId;
    const quota = rateLimit(clientKey(request, `tts:${scope}`), 30, 60_000);
    if (!quota.ok) {
      return failure(429, "RATE_LIMITED", "朗读请求太频繁，请稍后再试。", { "Retry-After": String(quota.retryAfter) });
    }

    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return failure(400, "BAD_REQUEST", "朗读文本无效。");
    }

    const apiKey = process.env.TTS_API_KEY?.trim() || process.env.EMBEDDING_API_KEY?.trim();
    if (!apiKey) {
      return failure(503, "TTS_NOT_CONFIGURED", "朗读服务未配置。");
    }

    const model = process.env.TTS_MODEL?.trim() || "qwen3-tts-flash";
    const voice = parsed.data.voice || process.env.TTS_VOICE?.trim() || "Cherry";
    const endpoint = process.env.TTS_BASE_URL?.trim() || DEFAULT_ENDPOINT;

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: { text: parsed.data.text, voice } }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("TTS UPSTREAM ERROR", upstream.status, detail.slice(0, 300));
      return failure(502, "TTS_FAILED", "朗读暂时不可用，稍后再试。");
    }

    const payload = (await upstream.json()) as { output?: { audio?: { url?: string; data?: string } } };
    const audioUrl = payload.output?.audio?.url;
    const base64Audio = payload.output?.audio?.data;

    if (audioUrl) {
      const audio = await fetch(audioUrl, { signal: AbortSignal.timeout(20_000) });
      if (!audio.ok) {
        console.error("TTS AUDIO DOWNLOAD ERROR", audio.status);
        return failure(502, "TTS_FAILED", "朗读暂时不可用，稍后再试。");
      }
      const contentType = audio.headers.get("content-type");
      const type = contentType?.startsWith("audio/") ? contentType : audioUrl.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";
      return new NextResponse(await audio.arrayBuffer(), {
        headers: { "Content-Type": type, "Cache-Control": "no-store" },
      });
    }

    if (base64Audio) {
      return new NextResponse(Buffer.from(base64Audio, "base64"), {
        headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
      });
    }

    console.error("TTS RESPONSE WITHOUT AUDIO");
    return failure(502, "TTS_FAILED", "朗读暂时不可用，稍后再试。");
  } catch (error) {
    console.error("TTS ERROR", error);
    return failure(502, "TTS_FAILED", "朗读暂时不可用，稍后再试。");
  }
}
