import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';
import { checkProjectAccess, getClerkIdentity } from '@/lib/project-access';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Verify project access (both owners and collaborators can list collaborators)
  const { hasAccess, error } = await checkProjectAccess(projectId);
  if (!hasAccess) {
    if (error === 'unauthenticated') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    let enrichedCollaborators = collaborators.map((c) => ({
      id: c.id,
      email: c.email,
      name: null as string | null,
      imageUrl: null as string | null,
      createdAt: c.createdAt,
    }));

    const emails = collaborators.map((c) => c.email);

    if (emails.length > 0) {
      try {
        const clerk = await clerkClient();
        const clerkUsers = await clerk.users.getUserList({ emailAddress: emails });

        const emailToClerkUser = new Map();
        for (const u of clerkUsers.data) {
          for (const e of u.emailAddresses) {
            emailToClerkUser.set(e.emailAddress.toLowerCase().trim(), {
              name: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || null,
              imageUrl: u.imageUrl || null,
            });
          }
        }

        enrichedCollaborators = collaborators.map((c) => {
          const key = c.email.toLowerCase().trim();
          const clerkData = emailToClerkUser.get(key);
          return {
            id: c.id,
            email: c.email,
            name: clerkData?.name || null,
            imageUrl: clerkData?.imageUrl || null,
            createdAt: c.createdAt,
          };
        });
      } catch (error) {
        console.error('Error fetching clerk user list:', error);
      }
    }

    return Response.json({ collaborators: enrichedCollaborators });
  } catch (error) {
    console.error('Error listing collaborators:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    // Verify user is owner (only owner can invite)
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
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Prevent inviting the owner
    const { email: ownerEmail } = await getClerkIdentity();
    if (ownerEmail?.toLowerCase().trim() === email) {
      return Response.json(
        { error: 'Cannot invite the project owner as a collaborator' },
        { status: 400 }
      );
    }

    // Check if collaborator already exists
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    if (existing) {
      return Response.json({ error: 'Collaborator already invited' }, { status: 400 });
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
      },
    });

    // Enrich the response for the UI
    let name = null;
    let imageUrl = null;
    try {
      const clerk = await clerkClient();
      const clerkUsers = await clerk.users.getUserList({ emailAddress: [email] });
      if (clerkUsers.data.length > 0) {
        const u = clerkUsers.data[0];
        name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || null;
        imageUrl = u.imageUrl || null;
      }
    } catch (error) {
      console.error('Error fetching clerk user list for new collaborator:', error);
    }

    return Response.json({
      id: collaborator.id,
      email: collaborator.email,
      name,
      imageUrl,
      createdAt: collaborator.createdAt,
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
