"use client";

import React, { useState } from "react";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectProvider, Project } from "./project-context";
import { ProjectDialogs } from "./project-dialogs";

interface EditorLayoutProps {
  children: React.ReactNode;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function EditorLayout({ children, ownedProjects, sharedProjects }: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allInitialProjects = [...ownedProjects, ...sharedProjects];

  return (
    <ProjectProvider initialProjects={allInitialProjects}>
      <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
        {/* Top Navbar */}
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area */}
        <div className="flex-1 mt-16 relative overflow-hidden flex flex-col">
          {children}

          {/* Sidebar overlay */}
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
          />
        </div>
      </div>

      {/* Global Dialog instances */}
      <ProjectDialogs />
    </ProjectProvider>
  );
}
