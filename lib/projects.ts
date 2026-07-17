import { prisma } from './prisma';

export async function getProjectsForUser(userId: string, email?: string) {
  try {
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    let sharedProjects: any[] = [];
    if (email) {
      sharedProjects = await prisma.project.findMany({
        where: {
          collaborators: {
            some: {
              email: email.toLowerCase().trim(),
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return {
      ownedProjects: ownedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        roomId: p.id,
        isShared: false,
      })),
      sharedProjects: sharedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        roomId: p.id,
        isShared: true,
      })),
    };
  } catch (error) {
    console.error('Error in getProjectsForUser:', error);
    return { ownedProjects: [], sharedProjects: [] };
  }
}
