"use client";

import React, { useState, useEffect, useRef } from "react";
import { useProject } from "./project-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function ProjectDialogs() {
  const {
    dialogType,
    dialogTarget,
    isLoading,
    closeDialog,
    createProject,
    renameProject,
    deleteProject,
  } = useProject();

  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to generate a slug preview
  const generateSlugPreview = (val: string): string => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-");
  };

  // Sync state when dialog opens or target changes
  useEffect(() => {
    if (dialogType === "create") {
      setName("");
    } else if (dialogType === "rename" && dialogTarget) {
      setName(dialogTarget.name);
    }
  }, [dialogType, dialogTarget]);

  // Autofocus handling for rename dialog
  useEffect(() => {
    if (dialogType === "rename" && inputRef.current) {
      // Small timeout to ensure DOM is fully ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [dialogType]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    await createProject(name.trim());
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dialogTarget || isLoading) return;
    await renameProject(dialogTarget.id, name.trim());
  };

  const handleDeleteSubmit = async () => {
    if (!dialogTarget || isLoading) return;
    await deleteProject(dialogTarget.id);
  };

  return (
    <>
      {/* Create Project Dialog */}
      <Dialog open={dialogType === "create"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border border-border-default bg-bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">Create New Project</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Provide a name for your architecture project. This will scaffold a new workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="create-project-name" className="text-xs font-medium text-text-secondary">
                Project Name
              </label>
              <Input
                id="create-project-name"
                placeholder="My Awesome Architecture"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-bg-subtle border-border-subtle text-text-primary focus:border-accent-primary"
                required
              />
            </div>

            {name.trim() && (
              <div className="rounded-lg bg-bg-subtle p-3 border border-border-subtle text-xs space-y-1">
                <span className="font-medium text-text-secondary block">Workspace URL slug preview:</span>
                <span className="text-accent-primary font-mono select-all">
                  /editor/{generateSlugPreview(name)}
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
                className="border-border-default hover:bg-bg-subtle text-text-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-lg flex items-center gap-1.5"
              >
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog open={dialogType === "rename"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border border-border-default bg-bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">Rename Project</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Change the name of <span className="font-semibold text-text-primary">"{dialogTarget?.name}"</span>. This will update the slug URL automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="rename-project-name" className="text-xs font-medium text-text-secondary">
                New Project Name
              </label>
              <Input
                ref={inputRef}
                id="rename-project-name"
                placeholder="New project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-bg-subtle border-border-subtle text-text-primary focus:border-accent-primary"
                required
              />
            </div>

            {name.trim() && dialogTarget && generateSlugPreview(name) !== dialogTarget.slug && (
              <div className="rounded-lg bg-bg-subtle p-3 border border-border-subtle text-xs space-y-1">
                <span className="font-medium text-text-secondary block">New URL slug preview:</span>
                <span className="text-accent-primary font-mono select-all">
                  /editor/{generateSlugPreview(name)}
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
                className="border-border-default hover:bg-bg-subtle text-text-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading || (!!dialogTarget && name.trim() === dialogTarget.name)}
                className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-lg flex items-center gap-1.5"
              >
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Rename Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={dialogType === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border border-border-default bg-bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-state-error">Delete Project</DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Are you sure you want to delete <span className="font-semibold text-text-primary">"{dialogTarget?.name}"</span>? This action is permanent and cannot be undone. All layout node structure and AI canvas history will be lost.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle -mx-4 -mb-4 bg-muted/50 p-4 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isLoading}
              className="border-border-default hover:bg-bg-subtle text-text-primary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={isLoading}
              className="bg-state-error/10 text-state-error hover:bg-state-error/20 flex items-center gap-1.5 font-medium rounded-lg"
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
