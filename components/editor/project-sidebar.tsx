"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X, Folder, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders a slide-in sidebar for viewing projects and shared projects.
 *
 * @param isOpen - Whether the sidebar is visible.
 * @param onClose - Callback invoked when the sidebar should close.
 */
export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop overlay - floats on top of the canvas, clicks to close */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-30 flex w-80 flex-col border-r border-border-default bg-bg-surface text-text-primary transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-4">
          <h2 className="text-md font-semibold tracking-tight">Projects</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-bg-subtle text-text-secondary hover:text-text-primary"
            aria-label="Close projects sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs area */}
        <div className="flex-1 overflow-hidden p-4">
          <Tabs defaultValue="my-projects" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-bg-subtle p-1 border border-border-subtle">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>

            {/* My Projects content */}
            <TabsContent value="my-projects" className="flex-1 mt-4">
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle p-4 text-center">
                <Folder className="mb-2 h-8 w-8 text-text-faint" />
                <p className="text-sm font-medium text-text-secondary">No projects yet</p>
                <p className="text-xs text-text-muted mt-1">Create a new project to get started</p>
              </div>
            </TabsContent>

            {/* Shared content */}
            <TabsContent value="shared" className="flex-1 mt-4">
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle p-4 text-center">
                <Share2 className="mb-2 h-8 w-8 text-text-faint" />
                <p className="text-sm font-medium text-text-secondary">No shared projects</p>
                <p className="text-xs text-text-muted mt-1">Projects shared with you will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border-subtle p-4">
          <Button
            className="w-full justify-center gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/95 font-medium rounded-xl"
            onClick={() => {
              // Action handler for New Project
              console.log("New Project triggered");
            }}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
