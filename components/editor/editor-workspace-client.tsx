"use client";

import React, { useEffect } from "react";
import { useProject, Project } from "./project-context";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

import { CanvasRoom } from "./canvas/canvas-room";
import { CanvasEditor } from "./canvas/canvas-editor";

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
    <div className="flex-1 flex overflow-hidden relative">
      {/* Central canvas area */}
      <div className="flex-1 bg-bg-base relative flex overflow-hidden">
        <CanvasRoom roomId={project.roomId}>
          <CanvasEditor />
        </CanvasRoom>
      </div>

      {/* Right AI Sidebar placeholder */}
      {isAiSidebarOpen && (
        <aside className="absolute top-0 bottom-0 right-0 z-30 w-80 border-l border-border-default bg-bg-surface/95 backdrop-blur-sm flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
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
