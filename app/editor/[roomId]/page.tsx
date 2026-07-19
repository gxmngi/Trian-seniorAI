import { redirect, notFound } from "next/navigation";
import { checkProjectAccess } from "@/lib/project-access";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";
import { AccessDenied } from "@/components/editor/access-denied";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: PageProps) {
  const { roomId } = await params;

  try {
    const { hasAccess, project, error } = await checkProjectAccess(roomId);

    if (error === "unauthenticated") {
      redirect("/sign-in");
    }

    if (error === "not_found") {
      notFound();
    }

    if (!hasAccess || !project) {
      return <AccessDenied />;
    }

    return <EditorWorkspaceClient project={project} />;
  } catch (err) {
    console.error("WorkspacePage error:", err);
    notFound();
  }
}
