import { put, get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function PUT(
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
    const body = await request.json().catch(() => ({}));
    const { nodes, edges } = body;
    if (!nodes || !edges) {
      return Response.json({ error: "Invalid canvas payload" }, { status: 400 });
    }

    const canvasJson = { nodes, edges };

    let blobUrl = "";
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production Vercel Blob upload
      const blob = await put(`canvas-${projectId}.json`, JSON.stringify(canvasJson), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      blobUrl = blob.url;
    } else {
      console.warn("BLOB_READ_WRITE_TOKEN is missing. Using local dev mock backup.");
      blobUrl = `https://mock-blob-url.local/canvas-${projectId}.json`;

      // Persist locally for dev testing
      const fs = require("fs");
      const path = require("path");
      const dir = path.join(process.cwd(), "scratch");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(dir, `canvas-${projectId}.json`),
        JSON.stringify(canvasJson)
      );
    }

    // Save the blob URL in Prisma metadata
    await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJsonPath: blobUrl,
      },
    });

    return Response.json({ success: true, url: blobUrl });
  } catch (err) {
    console.error("Autosave canvas error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.canvasJsonPath) {
      return Response.json({ nodes: [], edges: [] });
    }

    let canvasJson = { nodes: [], edges: [] };
    if (project.canvasJsonPath.startsWith("https://mock-blob-url.local")) {
      // Local dev mock read
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "scratch", `canvas-${projectId}.json`);
      if (fs.existsSync(filePath)) {
        canvasJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } else {
      // Production Vercel Blob read
      const blobResult = await get(project.canvasJsonPath, { access: "private" });
      if (blobResult && blobResult.stream) {
        canvasJson = await new Response(blobResult.stream).json();
      }
    }

    return Response.json(canvasJson);
  } catch (err) {
    console.error("Load canvas error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
