import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, X, Send, Bot, FileText, ArrowDownToLine, Loader2 } from "lucide-react";
import {
  useCreateFeed,
  useFeedMessages,
  useFeeds,
  useOthers,
  useCreateFeedMessage,
  useSelf,
} from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { parseAiStatusFeedPayload, parseAiChatMessage } from "@/types/tasks";
import { useProject } from "./project-context";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// RunTracker — mounts when a run is active, fires callbacks on terminal states
// ---------------------------------------------------------------------------
interface RunTrackerProps {
  runId: string;
  accessToken: string;
  onCompleted: (result?: { summary?: string }) => void;
  onFailed: (error: string) => void;
}

function RunTracker({ runId, accessToken, onCompleted, onFailed }: RunTrackerProps) {
  const { run } = useRealtimeRun(runId, { accessToken });

  useEffect(() => {
    if (!run) return;
    if (run.status === "COMPLETED") {
      onCompleted(run.output as { summary?: string } | undefined);
    } else if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "SYSTEM_FAILURE"
    ) {
      onFailed(run.error?.message || "Unknown error");
    }
  }, [run?.status, run?.output, onCompleted, onFailed]);

  return null;
}

// ---------------------------------------------------------------------------
// AiSidebar
// ---------------------------------------------------------------------------
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const { activeProject } = useProject();
  const self = useSelf();
  const others = useOthers();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { feeds, isLoading: feedsLoading } = useFeeds();
  const { messages: statusFeedMessages } = useFeedMessages("ai-status-feed");
  const { messages: chatFeedMessages } = useFeedMessages("ai-chat");

  const [activeTab, setActiveTab] = useState<string>("architect");
  const [inputValue, setInputValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active run tracking
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isRunActive, setIsRunActive] = useState(false);

  // AI presence from Liveblocks (used for status text only, not gating)
  const aiAgent = others.find((other) => other.id === "ai-agent");
  const aiStatusMessage = aiAgent?.presence?.statusMessage || "";

  // ---------------------------------------------------------------------------
  // Ensure both feeds exist for this room.
  // createFeed throws if the feed already exists (e.g. created in a previous
  // session or by a concurrent client before feeds[] hydrates). We always
  // attempt the create and silently swallow "already exists" errors.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeProject?.id || feedsLoading || !feeds) return;

    const tryCreateFeed = async (id: string, name: string) => {
      try {
        await createFeed(id, { metadata: { name } });
      } catch (err: unknown) {
        // Ignore "already exists" — this is expected on reconnects / multi-client
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.toLowerCase().includes("already exists")) {
          console.error(`Failed to create feed "${id}":`, err);
        }
      }
    };

    const feedIds = Array.isArray(feeds)
      ? feeds
          .filter(
            (feed: unknown) =>
              Boolean(feed) &&
              typeof feed === "object" &&
              feed !== null &&
              "id" in feed
          )
          .map((feed: unknown) => (feed as { id: unknown }).id)
      : [];

    if (!feedIds.includes("ai-status-feed")) {
      void tryCreateFeed("ai-status-feed", "AI status feed");
    }
    if (!feedIds.includes("ai-chat")) {
      void tryCreateFeed("ai-chat", "AI chat feed");
    }
  }, [activeProject?.id, createFeed, feeds, feedsLoading]);

  // ---------------------------------------------------------------------------
  // Latest status text from ai-status-feed
  // ---------------------------------------------------------------------------
  const latestStatusText = useMemo(() => {
    const parsed: Array<{ createdAt?: number; text?: string }> = [];
    for (const msg of statusFeedMessages ?? []) {
      const payload = parseAiStatusFeedPayload((msg as { data?: unknown }).data);
      if (payload) {
        parsed.push({
          createdAt: (msg as { createdAt?: number }).createdAt,
          text: payload.text,
        });
      }
    }
    if (parsed.length === 0) return "";
    parsed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return parsed[0].text?.trim() || "";
  }, [statusFeedMessages]);

  const sharedStatusMessage =
    latestStatusText || aiStatusMessage || "Ghost AI is working...";

  // ---------------------------------------------------------------------------
  // Validated ai-chat feed messages
  // ---------------------------------------------------------------------------
  const validatedChatMessages = useMemo(() => {
    const result: Array<{
      id: string;
      createdAt: number;
      sender: string;
      role: string;
      content: string;
      timestamp: number;
    }> = [];
    for (const msg of chatFeedMessages ?? []) {
      const parsed = parseAiChatMessage((msg as { data?: unknown }).data);
      if (parsed) {
        result.push({
          id: (msg as { id: string }).id,
          createdAt: (msg as { createdAt: number }).createdAt,
          ...parsed,
        });
      }
    }
    result.sort((a, b) => a.createdAt - b.createdAt);
    return result;
  }, [chatFeedMessages]);

  // ---------------------------------------------------------------------------
  // Auto-resize textarea (72 – 160 px)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`;
  }, [inputValue]);

  // ---------------------------------------------------------------------------
  // Scroll to bottom on new messages
  // ---------------------------------------------------------------------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [validatedChatMessages]);

  // ---------------------------------------------------------------------------
  // RunTracker callbacks — stable references via useCallback
  // IMPORTANT: These must be defined BEFORE any early return to satisfy Rules of Hooks
  // ---------------------------------------------------------------------------
  const handleRunCompleted = useCallback(
    async (result?: { summary?: string }) => {
      const summary =
        result?.summary ||
        "I've generated the design on the canvas. Let me know if you'd like any changes.";
      try {
        await createFeedMessage("ai-chat", {
          sender: "Ghost AI",
          role: "ai",
          content: summary,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("ai-chat completion message error:", err);
      }
      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
    },
    [createFeedMessage]
  );

  const handleRunFailed = useCallback(
    async (errMsg: string) => {
      try {
        await createFeedMessage("ai-chat", {
          sender: "Ghost AI",
          role: "ai",
          content: `Sorry, the design agent encountered an error: ${errMsg}`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("ai-chat failure message error:", err);
      }
      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
    },
    [createFeedMessage]
  );

  // ---------------------------------------------------------------------------
  // Send handler: post to ai-chat + trigger design agent
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !activeProject || isRunActive) return;

    const senderName = self?.info?.name ?? "You";
    setInputValue("");
    setIsRunActive(true);

    // 1. Push user message to ai-chat feed immediately so all clients see it
    try {
      await createFeedMessage("ai-chat", {
        sender: senderName,
        role: "user",
        content: text,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("ai-chat user message error:", err);
      // Non-fatal — continue to trigger the agent anyway
    }

    // 2. Call /api/ai/design to start the run
    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          roomId: activeProject.id,
          projectId: activeProject.id,
        }),
      });

      if (!designRes.ok) {
        const errData = await designRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to start design generation"
        );
      }

      const { runId } = (await designRes.json()) as { runId: string };

      // 3. Fetch the public token scoped to this run
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to generate run token"
        );
      }

      const { token } = (await tokenRes.json()) as { token: string };

      // 4. Store runId + token → activates RunTracker
      setActiveRunId(runId);
      setActiveToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Design agent trigger error:", err);

      // Post the error as an AI message into ai-chat so all clients see it
      try {
        await createFeedMessage("ai-chat", {
          sender: "Ghost AI",
          role: "ai",
          content: `Failed to start the design agent: ${message}`,
          timestamp: Date.now(),
        });
      } catch {
        // Ignore secondary error
      }

      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const applyStarterPrompt = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <aside className="absolute top-0 bottom-0 right-0 z-30 w-80 border-l border-[#27272a] bg-[#0c0c0e]/95 backdrop-blur-sm flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Sparkles className="h-4.5 w-4.5 text-accent-ai animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">AI Workspace</h3>
            <p className="text-[10px] text-zinc-400">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-lg cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs
        defaultValue="architect"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 pb-1 border-b border-[#27272a] bg-[#080809]/50">
          <TabsList className="grid grid-cols-2 bg-[#121214] border border-[#27272a] p-1 rounded-lg">
            <TabsTrigger
              value="architect"
              className="text-xs py-1.5 rounded-md text-zinc-400 data-[state=active]:bg-[#1c1c1f] data-[state=active]:text-accent-ai data-[state=active]:font-semibold cursor-pointer transition-colors"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-xs py-1.5 rounded-md text-zinc-400 data-[state=active]:bg-[#1c1c1f] data-[state=active]:text-accent-ai data-[state=active]:font-semibold cursor-pointer transition-colors"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* AI Architect Tab                                                    */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent
          value="architect"
          className="flex-1 flex flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
        >
          {validatedChatMessages.length === 0 ? (
            /* Empty state */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center select-none">
              <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-2xl mb-4 shadow-inner">
                <Bot className="h-8 w-8 text-accent-ai opacity-80" />
              </div>
              <h4 className="text-xs font-bold text-zinc-200 mb-1">Ghost AI Architect</h4>
              <p className="text-[10px] text-zinc-400 max-w-[200px] leading-relaxed mb-6">
                Ask me to design architecture systems, microservices routing diagrams, or deployment pipelines.
              </p>

              {/* Starter prompt chips */}
              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={() => applyStarterPrompt("Design an e-commerce backend")}
                  className="w-full bg-[#18181b] hover:bg-[#1f1f23] border border-[#27272a] hover:border-zinc-700 text-zinc-300 text-[10px] font-medium py-2 px-3 rounded-xl text-left cursor-pointer transition-all"
                >
                  Design an e-commerce backend
                </button>
                <button
                  onClick={() => applyStarterPrompt("Create a chat app architecture")}
                  className="w-full bg-[#18181b] hover:bg-[#1f1f23] border border-[#27272a] hover:border-zinc-700 text-zinc-300 text-[10px] font-medium py-2 px-3 rounded-xl text-left cursor-pointer transition-all"
                >
                  Create a chat app architecture
                </button>
                <button
                  onClick={() => applyStarterPrompt("Build a CI/CD pipeline")}
                  className="w-full bg-[#18181b] hover:bg-[#1f1f23] border border-[#27272a] hover:border-zinc-700 text-zinc-300 text-[10px] font-medium py-2 px-3 rounded-xl text-left cursor-pointer transition-all"
                >
                  Build a CI/CD pipeline
                </button>
              </div>
            </div>
          ) : (
            /* Chat messages from ai-chat feed */
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3 pb-4">
                {validatedChatMessages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        isUser ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <span className="text-[9px] text-zinc-500 mb-1 px-1">
                        {msg.sender}&nbsp;&middot;&nbsp;
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? "bg-accent-ai text-white rounded-tr-none"
                            : "bg-[#0d0d10] border border-[#1f1f23] text-zinc-300 rounded-tl-none"
                        }`}
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Status strip — shown only while a run is active */}
          {isRunActive && (
            <div className="px-4 py-2 border-t border-[#27272a] bg-[#0a0a0d] flex items-center gap-2 text-[10px] text-accent-ai font-medium select-none">
              <Loader2 className="h-3 w-3 animate-spin shrink-0 text-accent-ai" />
              <span className="truncate">{sharedStatusMessage}</span>
            </div>
          )}

          {/* Chat input */}
          <div className="p-4 border-t border-[#27272a] bg-[#080809]/50 flex flex-col gap-2">
            <div className="relative flex items-end bg-[#0f0f12] border border-[#27272a] focus-within:border-zinc-700 rounded-xl overflow-hidden px-3 py-2 transition-all">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRunActive ? "Ghost AI is working..." : "Ask Ghost AI..."}
                disabled={isRunActive}
                className="flex-1 resize-none bg-transparent border-none outline-none shadow-none text-xs text-zinc-200 placeholder-zinc-500 p-0 focus:ring-0 min-h-[72px] max-h-[160px] disabled:opacity-50"
              />
              <Button
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || isRunActive}
                className="h-7 w-7 rounded-lg bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-35 disabled:hover:bg-accent-ai ml-2 shrink-0 flex items-center justify-center cursor-pointer transition-all"
              >
                {isRunActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[9px] text-zinc-500 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* Specs Tab                                                           */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent
          value="specs"
          className="flex-1 p-4 flex flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
        >
          <Button className="w-full bg-[#1c1c1f] hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg h-9 mb-4 transition-colors cursor-pointer flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-ai animate-pulse" />
            Generate Spec
          </Button>

          <div className="bg-[#0b0b0d] border border-[#1f1f23] rounded-xl p-4 flex flex-col">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#18181b] border border-[#27272a] rounded-lg text-accent-ai">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-zinc-200 truncate">
                  Microservices Architecture Spec
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                  System architecture blueprint detailing gateway routing middleware, auth
                  validation, and database schemas.
                </p>
              </div>
            </div>

            <Button
              disabled
              className="w-full bg-zinc-800/30 hover:bg-zinc-800/30 border border-zinc-800/50 text-zinc-500 text-xs font-semibold rounded-lg h-9 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Download Spec
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* RunTracker — mounts only while a run is in flight */}
      {activeRunId && activeToken && (
        <RunTracker
          runId={activeRunId}
          accessToken={activeToken}
          onCompleted={handleRunCompleted}
          onFailed={handleRunFailed}
        />
      )}
    </aside>
  );
}
