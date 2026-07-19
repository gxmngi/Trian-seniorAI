import Link from "next/link";
import { ArrowLeft, Ghost } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="flex-1 min-h-screen bg-[#080809] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-lg">
            <Ghost className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Project Not Found
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            This project doesn&apos;t exist or may have been deleted. Try
            creating a new one from your workspace.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 font-medium rounded-xl h-10 px-5 transition-all duration-200 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
