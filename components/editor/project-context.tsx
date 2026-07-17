"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useProjectActions, DialogType, Project } from "@/hooks/use-project-actions";

export type { DialogType, Project };

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  dialogType: DialogType;
  dialogTarget: Project | null;
  isLoading: boolean;
  isAiSidebarOpen: boolean;
  setIsAiSidebarOpen: (open: boolean) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  closeDialog: () => void;
  createProject: (name: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  initialProjects = [],
  children,
}: {
  initialProjects?: Project[];
  children: React.ReactNode;
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  // Sync projects state if initialProjects changes
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const actions = useProjectActions();

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        isAiSidebarOpen,
        setIsAiSidebarOpen,
        ...actions,
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
