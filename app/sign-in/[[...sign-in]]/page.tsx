import { SignIn } from "@clerk/nextjs";
import { Sparkles, Share2, FileText } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-bg-base text-text-primary">
      {/* Left Panel - Visible only on large screens */}
      <section className="hidden lg:flex flex-col justify-between bg-bg-surface p-16 border-r border-border-default select-none">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-accent-primary" />
          <span className="font-semibold text-xl text-text-primary tracking-tight">
            Ghost AI
          </span>
        </div>

        {/* Center content */}
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-text-primary leading-tight">
              Design systems at the speed of thought.
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/5 text-accent-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-text-primary">AI Architecture Generation</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/5 text-accent-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-text-primary">Real-time Collaboration</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/5 text-accent-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-text-primary">Instant Spec Generation</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-text-faint">
          © 2026 Ghost AI. All rights reserved.
        </div>
      </section>

      {/* Right Panel - Login Form */}
      <section className="flex items-center justify-center p-6 bg-bg-base">
        <SignIn />
      </section>
    </main>
  );
}
