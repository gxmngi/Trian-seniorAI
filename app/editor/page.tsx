"use client";

import { useProject } from "@/components/editor/project-context";
import { Button } from "@/components/ui/button";
import { Plus, Layout } from "lucide-react";

export default function EditorPage() {
  const { activeProject, openCreateDialog } = useProject();

  return (
    <div className="flex-1 relative flex items-center justify-center">
      {/* Canvas background dot grid style */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--border-default)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {activeProject ? (
        /* Active Project Canvas view placeholder */
        <div className="z-10 text-center select-none pointer-events-none animate-in fade-in duration-300">
          <div className="mb-4 flex justify-center opacity-25">
            <Layout className="h-12 w-12 text-text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            {activeProject.name}
          </h1>
          <p className="text-xs text-accent-primary mt-1 font-mono tracking-wider">
            /editor/{activeProject.slug}
          </p>
          <div className="mt-12">
            <h2 className="text-6xl font-bold tracking-tighter opacity-10 bg-gradient-to-b from-text-primary to-transparent bg-clip-text text-transparent">
              ghost AI
            </h2>
            <p className="text-xs text-text-muted mt-2 tracking-widest uppercase opacity-15">
              Design Canvas &amp; Spec Workspace
            </p>
          </div>
        </div>
      ) : (
        /* Editor Home screen (no active project selected) */
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
      )}
    </div>
  );
}
