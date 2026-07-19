import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

  // 1. Authenticate and check project access
  const { hasAccess, error } = await checkProjectAccess(projectId);
  if (!hasAccess) {
    const status =
      error === "unauthenticated" ? 401 : error === "not_found" ? 404 : 403;
    return Response.json({ error: error || "Forbidden" }, { status });
  }

  try {
    // 2. Fetch the spec metadata from Prisma
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
    });

    if (!spec) {
      return Response.json({ error: "Spec not found" }, { status: 404 });
    }

    // 3. Verify the spec belongs to the project
    if (spec.projectId !== projectId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Retrieve the spec content
    let specContent = "";
    if (spec.filePath.startsWith("https://mock-blob-url.local")) {
      // Local dev mock read
      const fs = require("fs");
      const path = require("path");
      const url = new URL(spec.filePath);
      const fileName = path.basename(url.pathname);
      const filePath = path.join(process.cwd(), "scratch", fileName);

      if (!fs.existsSync(filePath)) {
        return Response.json({ error: "Spec file content not found" }, { status: 404 });
      }
      specContent = fs.readFileSync(filePath, "utf-8");
    } else {
      // Production Vercel Blob read
      const blobResult = await get(spec.filePath, { access: "private" });
      if (!blobResult || !blobResult.stream) {
        return Response.json({ error: "Spec file content not found" }, { status: 404 });
      }
      specContent = await new Response(blobResult.stream).text();
    }

    // 5. Return as a downloadable Markdown attachment
    const headers = new Headers();
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Content-Disposition", `attachment; filename="architecture-spec-${specId}.md"`);

    return new Response(specContent, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Download spec error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
