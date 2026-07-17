"use client";

import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Renders the editor navigation bar with sidebar controls and branding.
 *
 * @param isSidebarOpen - Whether the sidebar is currently open
 * @param onToggleSidebar - Callback invoked when the sidebar toggle is clicked
 */
export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-border-default bg-bg-surface px-4 text-text-primary">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="hover:bg-bg-subtle text-text-secondary hover:text-text-primary"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-accent-primary to-accent-ai bg-clip-text text-transparent">
          ghost AI
        </span>
      </div>

      {/* Center Section */}
      <div className="flex items-center">
        {/* Can be extended later */}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Remains empty for now */}
      </div>
    </header>
  );
}
