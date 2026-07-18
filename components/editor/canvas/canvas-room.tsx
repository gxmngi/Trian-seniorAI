import React from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactFlowProvider } from "@xyflow/react";

interface CanvasRoomProps {
  roomId: string;
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Liveblocks connection error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function CanvasRoom({ roomId, children }: CanvasRoomProps) {
  const errorFallback = (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-base text-text-secondary p-6 text-center select-none space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-full p-3 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-semibold text-text-primary">Connection Error</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Could not establish a connection to the collaboration room. Please check your permissions or network connection and retry.
        </p>
      </div>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="border-border-default hover:bg-bg-subtle text-text-primary text-xs"
      >
        Retry Connection
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            isThinking: false,
          }}
          initialStorage={{
            flow: new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            }),
          }}
        >
          <ClientSideSuspense
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center bg-bg-base text-text-secondary select-none">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-primary opacity-75" />
                  <p className="text-xs font-medium tracking-wide">Connecting to collaborative session...</p>
                </div>
              </div>
            }
          >
            <ReactFlowProvider>
              {children}
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </ErrorBoundary>
  );
}
