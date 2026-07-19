import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { hasAccess, error } = await checkProjectAccess(projectId);
  if (!hasAccess) {
    const status =
      error === "unauthenticated" ? 401 : error === "not_found" ? 404 : 403;
    return Response.json({ error: error || "Forbidden" }, { status });
  }

  try {
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(specs);
  } catch (err) {
    console.error("List project specs error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
