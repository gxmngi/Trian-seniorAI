import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { designAgent } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const { userId } = await getClerkIdentity();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, roomId, projectId } = body;

    if (!prompt || !roomId || !projectId) {
      return Response.json(
        { error: "Missing prompt, roomId, or projectId" },
        { status: 400 }
      );
    }

    const { hasAccess, error } = await checkProjectAccess(projectId);
    if (!hasAccess) {
      const status =
        error === "unauthenticated" ? 401 : error === "not_found" ? 404 : 403;
      return Response.json({ error: error || "Forbidden" }, { status });
    }

    // Trigger the background design task through Trigger.dev
    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
    });

    // Save the task run record in Prisma for tracking and ownership verification
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });

    return Response.json({ runId: handle.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;

    console.error("Trigger design task error:", err);

    // Trigger.dev dev server not running (ECONNREFUSED / ENOTFOUND)
    if (cause === "ECONNREFUSED" || cause === "ENOTFOUND" || message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      return Response.json(
        { error: "Trigger.dev dev server is not running. Start it with: npx trigger.dev@latest dev" },
        { status: 503 }
      );
    }

    return Response.json(
      { error: process.env.NODE_ENV === "development" ? message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
