import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; collaboratorId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId, collaboratorId } = await params;

  try {
    // Verify user is owner (only owner can remove collaborators)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify collaborator exists and belongs to project
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaborator || collaborator.projectId !== projectId) {
      return Response.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
