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
  useStorage,
} from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { parseAiStatusFeedPayload, parseAiChatMessage } from "@/types/tasks";
import { useProject } from "./project-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [runType, setRunType] = useState<"design" | "spec" | null>(null);

  // Spec states
  const [specs, setSpecs] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Retrieve canvas flow nodes and edges from storage
  const flow = useStorage((root: any) => root.flow);
  const nodesArray = useMemo(() => {
    if (!flow?.nodes) return [];
    return Object.values(flow.nodes);
  }, [flow?.nodes]);

  const edgesArray = useMemo(() => {
    if (!flow?.edges) return [];
    return Object.values(flow.edges);
  }, [flow?.edges]);

  // Fetch specs list
  const fetchSpecs = useCallback(async () => {
    if (!activeProject?.id) return;
    setSpecsLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/specs`);
      if (res.ok) {
        const data = await res.json();
        setSpecs(data);
      }
    } catch (err) {
      console.error("Failed to fetch specs:", err);
    } finally {
      setSpecsLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    void fetchSpecs();
  }, [fetchSpecs]);

  const getFilename = (filePath: string) => {
    try {
      if (filePath.startsWith("https://mock-blob-url.local")) {
        const url = new URL(filePath);
        return url.pathname.replace(/^\//, "");
      }
      const url = new URL(filePath);
      const parts = url.pathname.split("/");
      return parts[parts.length - 1];
    } catch {
      return "spec.md";
    }
  };

  const handleOpenPreview = async (spec: any) => {
    setSelectedSpec(spec);
    setPreviewContent("");
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject?.id}/specs/${spec.id}/download`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      } else {
        setPreviewContent("Failed to load specification content.");
      }
    } catch (err) {
      console.error("Failed to fetch spec content:", err);
      setPreviewContent("Failed to load specification content.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setSelectedSpec(null);
    setPreviewContent("");
  };

  const handleDownload = (spec: any) => {
    if (!activeProject?.id) return;
    const downloadUrl = `/api/projects/${activeProject.id}/specs/${spec.id}/download`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = getFilename(spec.filePath);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    async (result?: { summary?: string } | string | any) => {
      if (runType === "spec") {
        try {
          await createFeedMessage("ai-chat", {
            sender: "Ghost AI",
            role: "ai",
            content: "I've successfully generated and saved the technical specification. You can find it under the **Specs** tab.",
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error("ai-chat spec message error:", err);
        }
        void fetchSpecs();
      } else {
        const summary =
          (result && typeof result === "object" && "summary" in result ? result.summary : null) ||
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
      }
      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
      setRunType(null);
    },
    [runType, fetchSpecs, createFeedMessage]
  );

  const handleRunFailed = useCallback(
    async (errMsg: string) => {
      try {
        await createFeedMessage("ai-chat", {
          sender: "Ghost AI",
          role: "ai",
          content: runType === "spec"
            ? `Sorry, the specification generation agent encountered an error: ${errMsg}`
            : `Sorry, the design agent encountered an error: ${errMsg}`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("ai-chat failure message error:", err);
      }
      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
      setRunType(null);
    },
    [runType, createFeedMessage]
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
      setRunType("design");
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

  const handleGenerateSpec = async () => {
    if (!activeProject || isRunActive) return;

    setIsRunActive(true);
    setRunType("spec");

    // 1. Post user trigger message to ai-chat feed immediately
    const senderName = self?.info?.name ?? "You";
    try {
      await createFeedMessage("ai-chat", {
        sender: senderName,
        role: "user",
        content: "Generate a technical specification for the current canvas architecture.",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("ai-chat user spec message error:", err);
    }

    try {
      // 2. Call /api/ai/spec to start the run
      const specRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeProject.id,
          chatHistory: validatedChatMessages,
          nodes: nodesArray,
          edges: edgesArray,
        }),
      });

      if (!specRes.ok) {
        const errData = await specRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to start spec generation"
        );
      }

      const { runId } = (await specRes.json()) as { runId: string };

      // 3. Fetch the public token scoped to this run
      const tokenRes = await fetch("/api/ai/spec/token", {
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
      console.error("Spec agent trigger error:", err);

      try {
        await createFeedMessage("ai-chat", {
          sender: "Ghost AI",
          role: "ai",
          content: `Failed to start the spec generation: ${message}`,
          timestamp: Date.now(),
        });
      } catch {
        // Ignore secondary error
      }

      setIsRunActive(false);
      setActiveRunId(null);
      setActiveToken(null);
      setRunType(null);
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
          <Button
            onClick={handleGenerateSpec}
            disabled={isRunActive}
            className="w-full bg-[#1c1c1f] hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg h-9 mb-4 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-ai animate-pulse" />
            {isRunActive && runType === "spec" ? "Generating..." : "Generate Spec"}
          </Button>

          {specsLoading && specs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none bg-[#09090b]/40 rounded-xl border border-zinc-800/40">
              <Loader2 className="h-6 w-6 animate-spin text-accent-ai mb-2" />
              <p className="text-xs text-zinc-400">Loading specs...</p>
            </div>
          ) : specs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none bg-[#09090b]/40 rounded-xl border border-zinc-800/40">
              <FileText className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400">No specifications generated yet.</p>
              <p className="text-[10px] text-zinc-500 max-w-[180px] mt-1">
                Click the button above to generate one from the current canvas layout.
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-3 pr-2">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    onClick={() => handleOpenPreview(spec)}
                    className="group bg-[#0b0b0d] hover:bg-[#121215] border border-[#1f1f23] hover:border-zinc-700/60 rounded-xl p-3.5 flex flex-col cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#18181b] group-hover:bg-[#1f1f24] border border-[#27272a] group-hover:border-zinc-700 rounded-lg text-accent-ai transition-colors">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
                          {getFilename(spec.filePath)}
                        </h4>
                        <p className="text-[9px] text-zinc-400 mt-1">
                          Generated {new Date(spec.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3.5 pt-3 border-t border-[#1f1f23] group-hover:border-zinc-800/80">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(spec);
                        }}
                        className="flex-1 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-[10px] font-semibold rounded-lg h-7 gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
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

      {/* Spec Preview Dialog */}
      <Dialog open={selectedSpec !== null} onOpenChange={(open) => { if (!open) handleClosePreview(); }}>
        <DialogContent className="max-w-2xl bg-[#0c0c0e] border border-zinc-800 text-zinc-100 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] outline-none">
          <DialogHeader className="border-b border-zinc-800 pb-4 mb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#18181b] border border-[#27272a] rounded-lg text-accent-ai">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold text-zinc-100 truncate">
                  {selectedSpec ? getFilename(selectedSpec.filePath) : "Specification Preview"}
                </DialogTitle>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {selectedSpec && `Generated on ${new Date(selectedSpec.createdAt).toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2 min-h-0">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
                <Loader2 className="h-7 w-7 animate-spin text-accent-ai" />
                <p className="text-xs text-zinc-400 font-medium">Fetching specification content...</p>
              </div>
            ) : (
              <div className="pb-6">
                <MarkdownPreview content={previewContent} />
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="border-t border-zinc-800 pt-4 mt-4 flex items-center justify-between gap-3">
            <div className="text-[10px] text-zinc-500">
              * Esc to close, Tab to navigate
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleClosePreview}
                className="bg-transparent hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-transparent rounded-lg h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
              <Button
                onClick={() => selectedSpec && handleDownload(selectedSpec)}
                className="bg-accent-ai hover:bg-accent-ai/90 text-white rounded-lg h-9 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Download Markdown
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function parseInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-4 text-sm text-zinc-300 leading-relaxed font-sans">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold text-zinc-100 border-b border-zinc-800 pb-2 mt-6">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-semibold text-zinc-100 mt-5">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-medium text-zinc-100 mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith("- ")) {
          return <li key={i} className="ml-4 list-disc pl-1">{parseInlineStyles(line.slice(2))}</li>;
        }
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        return <p key={i}>{parseInlineStyles(line)}</p>;
      })}
    </div>
  );
}
