import { z } from "zod";

export const aiStatusFeedPayloadSchema = z.object({
  text: z.string().optional(),
}).strict();

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export function parseAiStatusFeedPayload(value: unknown): AiStatusFeedPayload | null {
  const parsed = aiStatusFeedPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// Schema for messages sent via the ai-chat Liveblocks feed.
// Separate from ai-status-feed which tracks AI presence/progress.
export const aiChatMessageSchema = z.object({
  sender: z.string(),
  role: z.enum(["user", "ai"]),
  content: z.string(),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export function parseAiChatMessage(value: unknown): AiChatMessage | null {
  const parsed = aiChatMessageSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
