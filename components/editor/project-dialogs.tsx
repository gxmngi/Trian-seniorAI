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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Globe,
  Mail,
  Link2,
  UserPlus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

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

  // Share dialog states
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isCollabLoading, setIsCollabLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Fetch collaborators for Share Dialog
  const fetchCollaborators = async () => {
    if (!dialogTarget) return;
    setIsCollabLoading(true);
    try {
      const res = await fetch(`/api/projects/${dialogTarget.id}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      } else {
        console.error("Failed to fetch collaborators");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCollabLoading(false);
    }
  };

  useEffect(() => {
    if (dialogType === "share" && dialogTarget) {
      fetchCollaborators();
      setInviteEmail("");
      setInviteError(null);
      setCopied(false);
    }
  }, [dialogType, dialogTarget]);

  // Autofocus handling for rename dialog
  useEffect(() => {
    if (dialogType === "rename" && inputRef.current) {
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogTarget || !inviteEmail.trim() || isInviting) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      const res = await fetch(`/api/projects/${dialogTarget.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to invite collaborator");
      }

      const newCollaborator = await res.json();
      setCollaborators((prev) => [...prev, newCollaborator]);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.message || "An unexpected error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!dialogTarget) return;

    setCollaborators((prev) =>
      prev.map((c) => (c.id === collaboratorId ? { ...c, removing: true } : c))
    );

    try {
      const res = await fetch(
        `/api/projects/${dialogTarget.id}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to remove collaborator");
      }

      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    } catch (err) {
      console.error(err);
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collaboratorId ? { ...c, removing: false } : c))
      );
    }
  };

  const handleCopyLink = () => {
    if (!dialogTarget) return;
    const projectUrl = `${window.location.origin}/editor/${dialogTarget.id}`;
    navigator.clipboard.writeText(projectUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
                <span className="font-medium text-text-secondary block">Workspace URL ID preview:</span>
                <span className="text-accent-primary font-mono select-all">
                  /editor/{generateSlugPreview(name)}-xxxx
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
              Change the name of <span className="font-semibold text-text-primary">"{dialogTarget?.name}"</span>. This will update the project name immediately.
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

      {/* Share Project Dialog */}
      <Dialog open={dialogType === "share"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="border border-border-default bg-bg-surface sm:max-w-md max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent-primary" />
              Share Project
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Manage collaborators and share access to <span className="font-semibold text-text-primary">"{dialogTarget?.name}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Link Sharing */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Project Link</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-2.5 h-4 w-4 text-text-secondary" />
                  <Input
                    readOnly
                    value={dialogTarget ? `${typeof window !== "undefined" ? window.location.origin : ""}/editor/${dialogTarget.id}` : ""}
                    className="pl-9 bg-bg-subtle border-border-subtle text-text-secondary focus:border-border-subtle text-xs select-all"
                  />
                </div>
                <Button
                  onClick={handleCopyLink}
                  type="button"
                  variant="outline"
                  className={cn(
                    "border-border-default text-xs font-medium hover:bg-bg-subtle text-text-primary h-9 px-3 shrink-0 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer",
                    copied && "border-green-600/30 bg-green-500/10 text-green-400 hover:bg-green-500/25 hover:text-green-300"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Invite Collaborator (Owners only) */}
            {!dialogTarget?.isShared && (
              <form onSubmit={handleInvite} className="space-y-1.5 pt-2 border-t border-border-subtle">
                <label htmlFor="invite-email" className="text-xs font-medium text-text-secondary">
                  Invite Collaborator
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-text-secondary" />
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="collaborator@example.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        if (inviteError) setInviteError(null);
                      }}
                      disabled={isInviting}
                      className="pl-9 bg-bg-subtle border-border-subtle text-text-primary focus:border-accent-primary text-xs"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!inviteEmail.trim() || isInviting}
                    className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-lg flex items-center gap-1.5 text-xs h-9 cursor-pointer"
                  >
                    {isInviting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span>Invite</span>
                  </Button>
                </div>
                {inviteError && (
                  <p className="text-xxs text-state-error mt-1">{inviteError}</p>
                )}
              </form>
            )}

            {/* Collaborators List */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-text-secondary">
                  Collaborators {collaborators.length > 0 && `(${collaborators.length})`}
                </label>
                {dialogTarget?.isShared && (
                  <span className="text-xxs font-semibold bg-bg-subtle border border-border-subtle px-2 py-0.5 rounded-full text-text-secondary">
                    View Only
                  </span>
                )}
              </div>

              <ScrollArea className="max-h-[180px] min-h-[50px] overflow-y-auto pr-1 border border-border-subtle rounded-lg bg-bg-subtle/50 p-2">
                {isCollabLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-text-secondary opacity-55" />
                  </div>
                ) : collaborators.length === 0 ? (
                  <div className="h-20 flex flex-col items-center justify-center text-center px-4">
                    <p className="text-xxs text-text-secondary font-medium">No collaborators yet</p>
                    <p className="text-[10px] text-text-muted">
                      {dialogTarget?.isShared
                        ? "There are no other collaborators on this project."
                        : "Invite collaborators by email to edit this project together."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-3 p-1.5 rounded-md hover:bg-bg-subtle transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Custom Avatar */}
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-accent-primary/10 text-accent-primary flex items-center justify-center font-semibold text-xs border border-border-subtle shrink-0">
                            {c.imageUrl ? (
                              <img
                                src={c.imageUrl}
                                alt={c.name || c.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (c.name || c.email).substring(0, 2).toUpperCase()
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            {c.name ? (
                              <>
                                <span className="text-xs font-semibold text-text-primary truncate">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-text-secondary truncate">
                                  {c.email}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-text-primary truncate">
                                {c.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Remove Button (Owner only) */}
                        {!dialogTarget?.isShared && (
                          <Button
                            onClick={() => handleRemoveCollaborator(c.id)}
                            disabled={c.removing}
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-text-secondary hover:text-state-error hover:bg-state-error/10 rounded-md shrink-0 cursor-pointer"
                            aria-label={`Remove ${c.name || c.email}`}
                          >
                            {c.removing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={closeDialog}
              className="border-border-default hover:bg-bg-subtle text-text-primary text-xs w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

