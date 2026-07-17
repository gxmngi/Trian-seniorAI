import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const data: any = {};
    
    if (body.name !== undefined) {
      const trimmedName = body.name?.trim();
      if (!trimmedName) {
        return Response.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      data.name = trimmedName;
    }

    if (body.description !== undefined) {
      data.description = body.description;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    return Response.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
