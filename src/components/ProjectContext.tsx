'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@/lib/types';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string;
  loading: boolean;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  activeProjectId: 'proj-mohawk',
  loading: true,
  switchProject: () => {},
  deleteProject: async () => ({ success: false }),
  refreshProjects: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-mohawk');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);

        // Check stored project ID in localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('active_project_id') : null;
        if (stored && data.some(p => p.id === stored)) {
          setActiveProjectId(stored);
        } else if (data.length > 0) {
          setActiveProjectId(data[0].id);
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
  }, []);

  const switchProject = (id: string) => {
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_project_id', id);
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
