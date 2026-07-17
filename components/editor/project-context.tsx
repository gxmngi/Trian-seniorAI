"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Project {
  id: string;
  name: string;
  slug: string;
  isShared: boolean;
}

export type DialogType = "create" | "rename" | "delete" | null;

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  dialogType: DialogType;
  dialogTarget: Project | null;
  isLoading: boolean;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  closeDialog: () => void;
  createProject: (name: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const INITIAL_PROJECTS: Project[] = [
  { id: "proj-1", name: "Ghost Canvas", slug: "ghost-canvas", isShared: false },
  { id: "proj-2", name: "AI Architecture Design", slug: "ai-architecture-design", isShared: false },
  { id: "proj-3", name: "Senior Canvas Spec", slug: "senior-canvas-spec", isShared: true },
  { id: "proj-4", name: "Microservices Blueprint", slug: "microservices-blueprint", isShared: true },
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogTarget, setDialogTarget] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openCreateDialog = () => {
    setDialogType("create");
    setDialogTarget(null);
  };

  const openRenameDialog = (project: Project) => {
    setDialogType("rename");
    setDialogTarget(project);
  };

  const openDeleteDialog = (project: Project) => {
    setDialogType("delete");
    setDialogTarget(project);
  };

  const closeDialog = () => {
    setDialogType(null);
    setDialogTarget(null);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove all non-word chars except space and hyphen
      .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
  };

  const createProject = async (name: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      slug: generateSlug(name) || "untitled-project",
      isShared: false,
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProject(newProject);
    setIsLoading(false);
    closeDialog();
  };

  const renameProject = async (id: string, newName: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === id
          ? { ...proj, name: newName, slug: generateSlug(newName) || proj.slug }
          : proj
      )
    );
    if (activeProject?.id === id) {
      setActiveProject((prev) =>
        prev
          ? { ...prev, name: newName, slug: generateSlug(newName) || prev.slug }
          : null
      );
    }
    setIsLoading(false);
    closeDialog();
  };

  const deleteProject = async (id: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    setProjects((prev) => prev.filter((proj) => proj.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(null);
    }
    setIsLoading(false);
    closeDialog();
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        dialogType,
        dialogTarget,
        isLoading,
        openCreateDialog,
        openRenameDialog,
        openDeleteDialog,
        closeDialog,
        createProject,
        renameProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
