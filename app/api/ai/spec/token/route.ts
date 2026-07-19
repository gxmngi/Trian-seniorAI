import { getClerkIdentity } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { auth } from "@trigger.dev/sdk/v3";

export async function POST(request: Request) {
  const { userId } = await getClerkIdentity();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { runId } = body;

    if (!runId) {
      return Response.json({ error: "Missing runId" }, { status: 400 });
    }

    // Verify task run existence
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return Response.json({ error: "Task run not found" }, { status: 404 });
    }

    // Verify ownership
    if (taskRun.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate a Trigger.dev public token scoped to that run
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: "1h",
    });

    return Response.json({ token: publicToken });
  } catch (err) {
    console.error("Generate spec token error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
