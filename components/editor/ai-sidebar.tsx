import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, X, Send, Bot, FileText, ArrowDownToLine } from "lucide-react";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>("architect");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height between 72px and 160px
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 72), 160)}px`;
  }, [inputValue]);

  // Scroll to bottom of chat area when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response after a brief delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: `I've analyzed your request: "${userMessage.content}".\n\nI can help you build this architecture on the canvas! Let's start by placing the gateways and database services to anchor the flow.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyStarterPrompt = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

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

      {/* Main Tabs Container */}
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

        {/* AI Architect Tab Content */}
        <TabsContent
          value="architect"
          className="flex-1 flex flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
        >
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center select-none">
              <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-2xl mb-4 shadow-inner">
                <Bot className="h-8 w-8 text-accent-ai opacity-80" />
              </div>
              <h4 className="text-xs font-bold text-zinc-200 mb-1">Ghost AI Architect</h4>
              <p className="text-[10px] text-zinc-400 max-w-[200px] leading-relaxed mb-6">
                Ask me to design architecture systems, microservices routing diagrams, or deployment pipelines.
              </p>

              {/* Starter Prompt Chips */}
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
            /* Chat Messages List */
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-zinc-800/40 border border-[#27272a] text-zinc-100 rounded-tr-none"
                          : "bg-[#0d0d10] border border-[#1f1f23] text-zinc-300 rounded-tl-none"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Chat Input Area */}
          <div className="p-4 border-t border-[#27272a] bg-[#080809]/50 flex flex-col gap-2">
            <div className="relative flex items-end bg-[#0f0f12] border border-[#27272a] focus-within:border-zinc-700 rounded-xl overflow-hidden px-3 py-2 transition-all">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                className="flex-1 resize-none bg-transparent border-none outline-none shadow-none text-xs text-zinc-200 placeholder-zinc-500 p-0 focus:ring-0 min-h-[72px] max-h-[160px]"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="h-7 w-7 rounded-lg bg-accent-ai text-white hover:bg-accent-ai/90 disabled:opacity-35 disabled:hover:bg-accent-ai ml-2 shrink-0 flex items-center justify-center cursor-pointer transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[9px] text-zinc-500 text-center">
              Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </TabsContent>

        {/* Specs Tab Content */}
        <TabsContent
          value="specs"
          className="flex-1 p-4 flex flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
        >
          {/* Generate Action Button */}
          <Button className="w-full bg-[#1c1c1f] hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg h-9 mb-4 transition-colors cursor-pointer flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-ai animate-pulse" />
            Generate Spec
          </Button>

          {/* Demo Spec Card */}
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
                  System architecture blueprint detailing gateway routing middleware, auth validation, and database schemas.
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
    </aside>
  );
}
