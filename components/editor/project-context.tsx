"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useProjectActions, DialogType, Project } from "@/hooks/use-project-actions";
import { SaveStatus } from "@/hooks/use-autosave";

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
  isTemplatesModalOpen: boolean;
  setIsTemplatesModalOpen: (open: boolean) => void;
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  registerManualSave: (saveFn: () => Promise<boolean>) => void;
  triggerManualSave: () => Promise<boolean>;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  openShareDialog: (project: Project) => void;
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
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const manualSaveRef = React.useRef<(() => Promise<boolean>) | null>(null);

  const registerManualSave = React.useCallback((saveFn: () => Promise<boolean>) => {
    manualSaveRef.current = saveFn;
  }, []);

  const triggerManualSave = React.useCallback(async () => {
    if (manualSaveRef.current) {
      return await manualSaveRef.current();
    }
    return false;
  }, []);

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
        isTemplatesModalOpen,
        setIsTemplatesModalOpen,
        saveStatus,
        setSaveStatus,
        registerManualSave,
        triggerManualSave,
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
