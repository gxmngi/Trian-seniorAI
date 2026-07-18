import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export interface Project {
  id: string;
  name: string;
  roomId: string;
  isShared: boolean;
}

export type DialogType = 'create' | 'rename' | 'delete' | 'share' | null;

export function useProjectActions(onSuccess?: () => void) {
  const router = useRouter();
  const params = useParams();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogTarget, setDialogTarget] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openCreateDialog = () => {
    setDialogType('create');
    setDialogTarget(null);
  };

  const openRenameDialog = (project: Project) => {
    setDialogType('rename');
    setDialogTarget(project);
  };

  const openDeleteDialog = (project: Project) => {
    setDialogType('delete');
    setDialogTarget(project);
  };

  const openShareDialog = (project: Project) => {
    setDialogType('share');
    setDialogTarget(project);
  };

  const closeDialog = () => {
    setDialogType(null);
    setDialogTarget(null);
  };

  const generateRoomId = (name: string): string => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug || 'project'}-${suffix}`;
  };

  const createProject = async (name: string) => {
    setIsLoading(true);
    try {
      const roomId = generateRoomId(name);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, name }),
      });

      if (!res.ok) {
        throw new Error('Failed to create project');
      }

      const project = await res.json();
      closeDialog();
      router.push(`/editor/${project.id}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renameProject = async (id: string, newName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) {
        throw new Error('Failed to rename project');
      }

      closeDialog();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error renaming project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete project');
      }

      closeDialog();
      
      const currentRoomId = params?.roomId || params?.projectId;
      if (currentRoomId === id) {
        router.push('/editor');
      } else {
        router.refresh();
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dialogType,
    dialogTarget,
    isLoading,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    openShareDialog,
    closeDialog,
    createProject,
    renameProject,
    deleteProject,
  };
}
