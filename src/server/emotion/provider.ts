import { tagTrack, type TrackMeta, type TrackEmotion } from "./track";
import { readMoment, type MomentContext, type MomentReading } from "./moment";
import { makeLlmProvider } from "./llm";

/**
 * EmotionProvider — the swappable brain (architecture principle: never lock into
 * one AI vendor). The local provider is deterministic and key-free; when
 * OPENROUTER_API_KEY is set, the LLM provider transparently upgrades moment
 * reading with the SAME interface, so nothing downstream changes.
 */
export interface EmotionProvider {
  name: string;
  tagTrack(meta: TrackMeta): Promise<TrackEmotion> | TrackEmotion;
  readMoment(text: string, ctx?: MomentContext): Promise<MomentReading> | MomentReading;
}

export const localProvider: EmotionProvider = {
  name: "local-lexicon-v1",
  tagTrack,
  readMoment,
};

let cached: EmotionProvider | null = null;

export function getEmotionProvider(): EmotionProvider {
  if (cached) return cached;
  cached =
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 8
      ? makeLlmProvider(localProvider)
      : localProvider;
  return cached;
}
