import { EMOTION_DIMS, vec, clampVec, topDims, type DimName } from "./space";
import type { MomentContext, MomentReading, Signals } from "./moment";
import type { TrackMeta, TrackEmotion } from "./track";

/**
 * OpenRouter-backed emotion provider. Only constructed when OPENROUTER_API_KEY
 * is present (see provider.ts). Any failure — no key, bad JSON, network error,
 * timeout — silently falls back to the deterministic local provider, so the app
 * never breaks because of the LLM. Track tagging stays local (a catalog-scale
 * batch job is future work); the high-value LLM use is reading the moment.
 */

interface MinimalProvider {
  name: string;
  tagTrack(meta: TrackMeta): Promise<TrackEmotion> | TrackEmotion;
  readMoment(text: string, ctx?: MomentContext): Promise<MomentReading> | MomentReading;
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

function buildPrompt(text: string, ctx: MomentContext) {
  return [
    {
      role: "system",
      content:
        "You are Moodify's emotional read engine. Given a listener's moment, " +
        "return STRICT JSON only. Rate each emotional dimension 0..1 and infer " +
        "signal chips. Dimensions (in order): " +
        EMOTION_DIMS.join(", ") +
        '. JSON shape: {"dims":{<dim>:0..1,...},"signals":{"emotion":string|null,' +
        '"situation":string|null,"energy":string|null,"social":string|null}}. ' +
        "Never infer emotion the user did not imply; context only nudges energy/calm/focus.",
    },
    {
      role: "user",
      content: `Moment: "${text}"\nContext: ${JSON.stringify(ctx)}`,
    },
  ];
}

async function callOpenRouter(text: string, ctx: MomentContext): Promise<MomentReading> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://127.0.0.1:3000",
        "X-Title": "Moodify",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: buildPrompt(text, ctx),
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : "{}");

    const dimsObj = (parsed.dims ?? {}) as Record<string, number>;
    const named: Partial<Record<DimName, number>> = {};
    for (const d of EMOTION_DIMS) {
      const v = Number(dimsObj[d]);
      if (Number.isFinite(v)) named[d] = Math.max(0, Math.min(1, v));
    }
    const target = clampVec(vec(named));
    const s = (parsed.signals ?? {}) as Partial<Signals>;
    const signals: Signals = {
      emotion: s.emotion ?? topDims(target, 1)[0]?.name ?? null,
      situation: s.situation ?? null,
      energy: s.energy ?? null,
      social: s.social ?? null,
    };
    return {
      text,
      target,
      signals,
      matched: Object.values(signals).filter(Boolean) as string[],
      context: ctx,
      confidence: 0.9,
      model: process.env.OPENROUTER_MODEL || "openrouter",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function makeLlmProvider(fallback: MinimalProvider): MinimalProvider {
  return {
    name: `openrouter+${fallback.name}`,
    tagTrack: fallback.tagTrack,
    async readMoment(text: string, ctx: MomentContext = {}) {
      try {
        return await callOpenRouter(text, ctx);
      } catch {
        return fallback.readMoment(text, ctx);
      }
    },
  };
}
