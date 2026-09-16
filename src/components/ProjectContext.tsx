'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '@/lib/types';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string;
  loading: boolean;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  setUserDefaultPreference: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  activeProjectId: 'proj-mohawk',
  loading: true,
  switchProject: () => {},
  deleteProject: async () => ({ success: false }),
  setDefaultProject: async () => ({ success: false }),
  setUserDefaultPreference: async () => {},
  refreshProjects: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-mohawk');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: Project[] = await res.json();
        
        // Scope projects based on user session if member/viewer
        const user = session?.user as any;
        let visibleProjects = data;
        if (user && user.role !== 'admin' && Array.isArray(user.assignedProjectIds) && !user.assignedProjectIds.includes('*')) {
          visibleProjects = data.filter(p => user.assignedProjectIds.includes(p.id));
        }

        setProjects(visibleProjects);

        // Check user personal default preference or stored project ID in localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('active_project_id') : null;
        const userDefault = user?.defaultProjectId;
        const globalDefault = visibleProjects.find(p => p.isDefault)?.id;

        const candidateId = (stored && visibleProjects.some(p => p.id === stored))
          ? stored
          : (userDefault && visibleProjects.some(p => p.id === userDefault))
            ? userDefault
            : globalDefault || visibleProjects[0]?.id;

        if (candidateId) {
          setActiveProjectId(candidateId);
        }
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [session]);

  const switchProject = (id: string) => {
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_project_id', id);
    }
  };

  const setDefaultProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/projects/${id}/default`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to set default workspace' };
      }

      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          isDefault: p.id === id,
        }))
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hub:refresh'));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const setUserDefaultPreference = async (projectId: string) => {
    switchProject(projectId);
    if (session?.user?.email) {
      try {
        await fetch('/api/user/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email, defaultProjectId: projectId }),
        });
      } catch (e) {
        console.warn('Failed to save default project preference', e);
      }
    }
  };

  const deleteProject = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete workspace' };
      }

      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);

      if (activeProjectId === id && remaining.length > 0) {
        switchProject(remaining[0].id);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hub:refresh'));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeProjectId,
        loading,
        switchProject,
        deleteProject,
        setDefaultProject,
        setUserDefaultPreference,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
