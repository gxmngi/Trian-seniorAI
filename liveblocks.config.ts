import { LiveMap } from "@liveblocks/client";
import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasNode, CanvasEdge } from "./types/canvas";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      isThinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    // Custom user info set when authenticating with a session token
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: Record<string, never>;

    // Custom metadata set on threads, for useThreads, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info
    RoomInfo: Record<string, never>;

    // Custom group info
    GroupInfo: Record<string, never>;

    // Custom activities data
    ActivitiesData: Record<string, never>;
  }
}

export {};
