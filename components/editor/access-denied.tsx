"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex-1 min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-state-error/10 border border-state-error/25 flex items-center justify-center text-state-error shadow-lg shadow-state-error/5">
            <Lock className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Access Denied
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            You do not have permission to view this project, or the project does not exist. Please contact the project owner or check your workspace.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link href="/editor" passHref legacyBehavior>
            <Button
              className="bg-bg-surface hover:bg-bg-subtle text-text-primary border border-border-default hover:border-border-hover font-medium rounded-xl h-10 px-5 gap-2 cursor-pointer transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
