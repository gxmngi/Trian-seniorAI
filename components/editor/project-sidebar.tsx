"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X, Folder, Share2, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject, Project } from "./project-context";
import Link from "next/link";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function ProjectSidebar({ isOpen, onClose, ownedProjects, sharedProjects }: ProjectSidebarProps) {
  const {
    activeProject,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
  } = useProject();

  const [activeTab, setActiveTab] = useState("my-projects");

  // Auto-switch to the correct tab when an active project is loaded or changed
  useEffect(() => {
    if (activeProject) {
      setActiveTab(activeProject.isShared ? "shared" : "my-projects");
    }
  }, [activeProject]);

  const renderProjectItem = (project: Project, canModify: boolean) => {
    const isActive = activeProject?.id === project.id;
    return (
      <div
        key={project.id}
        className={cn(
          "group flex items-center justify-between rounded-lg p-2 text-sm transition-all duration-150 select-none",
          isActive
             ? "bg-bg-subtle text-accent-primary border-l-2 border-accent-primary pl-1.5"
             : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
        )}
      >
        <Link
          href={`/editor/${project.id}`}
          onClick={onClose}
          className="flex flex-1 items-center gap-2.5 overflow-hidden text-left"
        >
          <Folder className={cn("h-4 w-4 shrink-0", isActive ? "text-accent-primary" : "text-text-muted")} />
          <span className="truncate font-medium">{project.name}</span>
        </Link>

        {/* Action buttons - show rename/delete only for owned projects, and on hover/focus */}
        {canModify ? (
          <div className="ml-2 flex items-center gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openRenameDialog(project);
              }}
              className="text-text-muted hover:text-text-primary hover:bg-bg-elevated h-6 w-6"
              title="Rename project"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openDeleteDialog(project);
              }}
              className="text-text-muted hover:text-state-error hover:bg-state-error/10 h-6 w-6"
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay - floats on top of the canvas, clicks to close */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-30 flex w-80 flex-col border-r border-border-default bg-bg-surface/95 backdrop-blur-sm text-text-primary transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-[calc(100%+10px)] shadow-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-4">
          <h2 className="text-md font-semibold tracking-tight">Workspace Projects</h2>
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
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 bg-bg-subtle p-1 border border-border-subtle rounded-lg">
              <TabsTrigger value="my-projects" className="text-xs py-1 rounded-md">My Projects</TabsTrigger>
              <TabsTrigger value="shared" className="text-xs py-1 rounded-md">Shared</TabsTrigger>
            </TabsList>

            {/* My Projects content */}
            <TabsContent value="my-projects" className="flex-1 mt-3 space-y-1">
              {ownedProjects.length > 0 ? (
                <div className="space-y-1 py-1">
                  {ownedProjects.map((project) => renderProjectItem(project, true))}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle p-4 text-center mt-2 bg-bg-base/30">
                  <Folder className="mb-2 h-8 w-8 text-text-faint" />
                  <p className="text-sm font-medium text-text-secondary">No owned projects</p>
                  <p className="text-xs text-text-muted mt-1">Create a new project workspace below</p>
                </div>
              )}
            </TabsContent>

            {/* Shared content */}
            <TabsContent value="shared" className="flex-1 mt-3 space-y-1">
              {sharedProjects.length > 0 ? (
                <div className="space-y-1 py-1">
                  {sharedProjects.map((project) => renderProjectItem(project, false))}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle p-4 text-center mt-2 bg-bg-base/30">
                  <Share2 className="mb-2 h-8 w-8 text-text-faint" />
                  <p className="text-sm font-medium text-text-secondary">No shared projects</p>
                  <p className="text-xs text-text-muted mt-1">Projects shared by collaborators appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border-subtle p-4 bg-bg-surface/50">
          <Button
            className="w-full justify-center gap-2 bg-accent-primary text-bg-base hover:bg-accent-primary/95 font-medium rounded-xl h-9"
            onClick={() => {
              openCreateDialog();
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
