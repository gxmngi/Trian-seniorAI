"use client";

import React, { useState } from "react";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import { ProjectProvider } from "./project-context";
import { ProjectDialogs } from "./project-dialogs";

interface EditorLayoutProps {
  children: React.ReactNode;
}

export function EditorLayout({ children }: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProjectProvider>
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
          />
        </div>
      </div>

      {/* Global Dialog instances */}
      <ProjectDialogs />
    </ProjectProvider>
  );
}
