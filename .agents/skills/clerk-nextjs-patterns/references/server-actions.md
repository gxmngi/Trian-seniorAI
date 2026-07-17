# Server Actions

Server Actions are public endpoints. Always verify auth.

## Basic Protection

```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function createPost(formData: FormData) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error('Unauthorized');

  const titleValue = formData.get('title');
  if (titleValue instanceof File || typeof titleValue !== 'string' || titleValue.trim() === '') {
    throw new Error('Title is required');
  }
  const title = titleValue.trim();

  await db.posts.create({ data: { title, authorId: userId } });
  revalidatePath('/posts');
}
```

## Org + Role Check (B2B)

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';

export async function createTeamProject(formData: FormData) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) throw new Error('Must be in an organization');
  if (orgRole !== 'org:admin') throw new Error('Only admins can create projects');

  const nameValue = formData.get('name');
  if (nameValue instanceof File || typeof nameValue !== 'string' || nameValue.trim() === '') {
    throw new Error('Name is required');
  }
  const name = nameValue.trim();

  await db.projects.create({ data: { name, organizationId: orgId } });
}
```

## Permission Check (RBAC)

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';

export async function deleteProject(projectId: string) {
  const { userId, orgId, has } = await auth();
  if (!userId || !orgId) throw new Error('Unauthorized');

  const canDelete = await has({ permission: 'org:project:delete' });
  if (!canDelete) throw new Error('Missing permission');

  const deleted = await db.projects.deleteMany({
    where: { id: projectId, organizationId: orgId },
  });

  if (deleted.count !== 1) {
    throw new Error('Project not found or unauthorized');
  }
}
```

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` is not available. Use `if (!userId)` instead.

[Docs](https://clerk.com/docs/reference/nextjs/server-actions)
