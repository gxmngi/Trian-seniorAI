"use client";

import React, { useEffect } from "react";
import { useProject, Project } from "./project-context";
import { CanvasRoom } from "./canvas/canvas-room";
import { CanvasEditor } from "./canvas/canvas-editor";
import { AiSidebar } from "./ai-sidebar";

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
      <CanvasRoom roomId={project.roomId}>
        <div className="flex-1 bg-bg-base relative flex overflow-hidden">
          <CanvasEditor />
        </div>

        {/* Floating Right AI Chat/Architect Sidebar */}
        <AiSidebar isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />
      </CanvasRoom>
    </div>
  );
}
