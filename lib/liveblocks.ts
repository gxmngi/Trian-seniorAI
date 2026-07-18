import { Liveblocks } from "@liveblocks/node";

let liveblocksInstance: Liveblocks | undefined;

/**
 * Returns a cached, lazily-initialized Liveblocks Node client instance.
 */
export function getLiveblocks(): Liveblocks {
  if (!liveblocksInstance) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("Missing LIVEBLOCKS_SECRET_KEY environment variable.");
    }
    liveblocksInstance = new Liveblocks({ secret });
  }
  return liveblocksInstance;
}

const COLORS = [
  "#FF5555", // Coral Red
  "#FF9933", // Amber Orange
  "#FFCC00", // Bright Yellow
  "#33CC66", // Emerald Green
  "#33CCCC", // Turquoise/Teal
  "#3399FF", // Sky Blue
  "#6666FF", // Royal Purple
  "#CC66FF", // Lavender Pink
  "#FF66CC", // Hot Pink
  "#B58900", // Warm Gold
];

/**
 * Deterministically maps a user ID to a consistent color from a fixed 10-color palette.
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}
