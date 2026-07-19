"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles, LayoutTemplate, Cloud, CloudOff, Loader2 } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useProject } from "./project-context";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenShare?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  onOpenShare,
}: EditorNavbarProps) {
  const {
    activeProject,
    isAiSidebarOpen,
    setIsAiSidebarOpen,
    openShareDialog,
    setIsTemplatesModalOpen,
    saveStatus,
    setSaveStatus,
    triggerManualSave,
  } = useProject();
  const projectName = activeProject?.name;

  const [buttonState, setButtonState] = useState<"idle" | "saving" | "saved" | "error">(saveStatus);

  useEffect(() => {
    if (saveStatus === "saving") {
      setButtonState("saving");
    } else if (saveStatus === "saved") {
      setButtonState("saved");
      const timer = setTimeout(() => {
        setButtonState("idle");
        setSaveStatus("idle");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (saveStatus === "error") {
      setButtonState("error");
      const timer = setTimeout(() => {
        setButtonState("idle");
        setSaveStatus("idle");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (saveStatus === "idle") {
      setButtonState("idle");
    }
  }, [saveStatus, setSaveStatus]);

  const handleManualSave = async () => {
    if (triggerManualSave && buttonState !== "saving") {
      await triggerManualSave();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-border-default bg-bg-surface px-4 text-text-primary">
      {/* Left Section */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="hover:bg-bg-subtle text-text-secondary hover:text-text-primary shrink-0"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-accent-primary to-accent-ai bg-clip-text text-transparent shrink-0">
          ghost AI
        </span>
        {projectName && (
          <>
            <span className="h-4 w-px bg-border-subtle shrink-0" />
            <span className="text-sm font-semibold text-text-secondary truncate max-w-[180px] sm:max-w-[280px]">
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Center Section */}
      <div className="flex items-center">
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5 shrink-0">
        {projectName && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle gap-1.5 h-8.5 rounded-xl px-3 cursor-pointer"
              disabled={buttonState === "saving"}
              onClick={handleManualSave}
            >
              {buttonState === "saving" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-accent-ai" />
                  <span className="text-xs font-semibold">Saving ... </span>
                </>
              )}
              {buttonState === "error" && (
                <>
                  <CloudOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-400">Error</span>
                </>
              )}
              {buttonState === "saved" && (
                <>
                  <Cloud className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-semibold text-zinc-400">Saved</span>
                </>
              )}
              {buttonState === "idle" && (
                <>
                  <Cloud className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-400">Save</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle gap-1.5 h-8.5 rounded-xl px-3 cursor-pointer"
              onClick={() => setIsTemplatesModalOpen(true)}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-xs font-semibold hidden xs:inline">Templates</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle gap-1.5 h-8.5 rounded-xl px-3 cursor-pointer"
              onClick={() => {
                if (onOpenShare) {
                  onOpenShare();
                } else if (activeProject) {
                  openShareDialog(activeProject);
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs font-semibold hidden xs:inline">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-text-secondary hover:text-text-primary hover:bg-bg-subtle h-8.5 w-8.5 rounded-xl cursor-pointer transition-colors duration-150 mr-1.5",
                isAiSidebarOpen && "bg-bg-subtle text-accent-ai hover:text-accent-ai"
              )}
              onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
              aria-label={isAiSidebarOpen ? "Close AI Sidebar" : "Open AI Sidebar"}
            >
              <Sparkles className="h-4.5 w-4.5" />
            </Button>
          </>
        )}

        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="hover:bg-bg-subtle text-text-secondary hover:text-text-primary rounded-xl px-4 h-9">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-medium rounded-xl px-4 h-9">
              Sign Up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <div id="navbar-presence-portal" className="flex items-center" />
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8.5 w-8.5 rounded-full border border-border-default",
                },
              }}
            />
          </div>
        </Show>
      </div>
    </header>
  );
}
