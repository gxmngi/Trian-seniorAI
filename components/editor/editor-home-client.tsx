"use client";

import { useProject } from "./project-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function EditorHomeClient() {
  const { openCreateDialog } = useProject();

  return (
    <div className="flex-1 relative flex items-center justify-center">
      {/* Canvas background dot grid style */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--border-default)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Editor Home screen (no active project selected) */}
      <div className="z-10 text-center max-w-md px-6 space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary leading-tight">
            Create a project or open an existing one
          </h1>
          <p className="text-text-secondary text-sm">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Button
            onClick={openCreateDialog}
            className="bg-accent-primary text-bg-base hover:bg-accent-primary/95 font-medium rounded-xl h-10 px-6 gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            New Project
          </Button>
        </div>
      </div>
    </div>
  );
}
