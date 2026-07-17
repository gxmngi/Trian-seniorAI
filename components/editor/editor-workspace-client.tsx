"use client";

import React, { useEffect } from "react";
import { useProject, Project } from "./project-context";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface EditorWorkspaceClientProps {
  project: Project;
}

export function EditorWorkspaceClient({ project }: EditorWorkspaceClientProps) {
  const { setActiveProject, isAiSidebarOpen, setIsAiSidebarOpen } = useProject();

  // Set the active project in the project context on mount
  useEffect(() => {
    setActiveProject(project);
    return () => {
      setActiveProject(null);
    };
  }, [project, setActiveProject]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Central canvas area */}
      <div className="flex-1 bg-bg-base relative flex items-center justify-center overflow-hidden">
        {/* Canvas background dot grid style */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--border-default)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="z-10 text-center select-none pointer-events-none space-y-4 px-6">
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Architecture Design Canvas
          </h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            Interactive node editor placeholder. Canvas logic, shapes, and edge routing will be loaded here.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-bg-subtle border border-border-subtle text-accent-primary">
              Room ID: {project.roomId}
            </span>
          </div>
        </div>
      </div>

      {/* Right AI Sidebar placeholder */}
      {isAiSidebarOpen && (
        <aside className="w-80 border-l border-border-default bg-bg-surface flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-ai" />
              <h3 className="font-semibold text-sm text-text-primary">AI Workspace</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAiSidebarOpen(false)}
              className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-text-muted select-none space-y-2">
            <Sparkles className="h-8 w-8 text-accent-ai opacity-25" />
            <p className="text-xs font-medium text-text-secondary">AI Chat &amp; Spec Generator</p>
            <p className="text-xxs text-text-muted max-w-[200px]">
              Chat with Ghost AI to generate layouts, nodes, or write specification documents.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
