import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export async function getClerkIdentity() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, email: null };
  }
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || null;
  return { userId, email };
}

export async function checkProjectAccess(projectId: string) {
  const { userId, email } = await getClerkIdentity();
  if (!userId) {
    return { hasAccess: false, project: null, error: 'unauthenticated' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    return { hasAccess: false, project: null, error: 'not_found' };
  }

  // Check if owner
  if (project.ownerId === userId) {
    return {
      hasAccess: true,
      project: {
        id: project.id,
        name: project.name,
        roomId: project.id,
        isShared: false,
      },
      isOwner: true,
    };
  }

  // Check if collaborator
  if (email) {
    const isCollaborator = project.collaborators.some(
      (c) => c.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    if (isCollaborator) {
      return {
        hasAccess: true,
        project: {
          id: project.id,
          name: project.name,
          roomId: project.id,
          isShared: true,
        },
        isOwner: false,
      };
    }
  }

  return { hasAccess: false, project: null, error: 'forbidden' };
}
