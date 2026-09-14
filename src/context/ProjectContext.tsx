import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, ProjectFile } from '../types';
import { ProjectKnowledge, ProjectContext as ProjectContextModel } from '../types/knowledge';
import { AEGIS_JOURNAL_DEMO } from '../data/demoProject';
import { projectStorage } from '../services/projectStorage';
import { fileRepository, AddFileOptions } from '../services/fileRepository';
import { storageService, formatBytes } from '../services/storageService';
import { projectContextService } from '../services/knowledge/ProjectContextService';
import { projectKnowledgeRepository } from '../services/knowledge/ProjectKnowledgeRepository';
import { judgeSessionRepository } from '../services/judge/JudgeSessionRepository';
import { voiceSessionRepository } from '../services/voice/VoiceSessionRepository';
import { readinessReportRepository } from '../services/readiness/ReadinessReportRepository';
import { preparationPlanRepository } from '../services/prepare/PreparationPlanRepository';
import { chatHistoryService } from '../services/ai/ChatHistoryService';
import { useToast } from './ToastContext';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  hasProject: boolean;
  createProject: (name: string, description?: string, goal?: string) => Project | null;
  updateProject: (id: string, updates: Partial<Project>) => boolean;
  deleteProject: (id: string) => boolean;
  setActiveProjectById: (id: string) => void;
  loadDemoProject: () => void;
  closeProject: () => void;
  importFiles: (files: File[]) => Promise<{ addedCount: number; failedCount: number }>;
  importSingleFileWithResolution: (
    file: File,
    resolution: 'keep_both' | 'replace_existing'
  ) => Promise<boolean>;
  removeProjectFile: (fileId: string) => boolean;
  refreshProjectFiles: () => void;

  // Segment 4: Project Knowledge Engine
  projectKnowledge: ProjectKnowledge | null;
  projectContextData: ProjectContextModel;
  isProcessingKnowledge: boolean;
  rebuildActiveProjectKnowledge: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = projectStorage.getAllProjects();
    return saved.map((p) => ({
      ...p,
      files: fileRepository.getFilesByProjectId(p.id, p.isDemo),
    }));
  });

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    const saved = projectStorage.getAllProjects();
    const activeId = projectStorage.getActiveProjectId();
    if (activeId) {
      if (activeId === AEGIS_JOURNAL_DEMO.id) {
        return {
          ...AEGIS_JOURNAL_DEMO,
          files: fileRepository.getFilesByProjectId(AEGIS_JOURNAL_DEMO.id, true),
        };
      }
      const found = saved.find((p) => p.id === activeId);
      if (found) {
        return {
          ...found,
          files: fileRepository.getFilesByProjectId(found.id, found.isDemo),
        };
      }
    }
    return null;
  });

  // Knowledge state
  const [projectKnowledge, setProjectKnowledge] = useState<ProjectKnowledge | null>(() => {
    if (activeProject) {
      return projectKnowledgeRepository.getKnowledgeByProjectId(activeProject.id);
    }
    return null;
  });

  const [isProcessingKnowledge, setIsProcessingKnowledge] = useState(false);

  const { toast } = useToast();

  // Keep storage in sync when projects change
  const persistProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    projectStorage.saveAllProjects(updatedProjects);
  }, []);

  // Update knowledge state when active project changes
  useEffect(() => {
    if (!activeProject) {
      setProjectKnowledge(null);
      return;
    }

    const existing = projectKnowledgeRepository.getKnowledgeByProjectId(activeProject.id);
    if (existing && existing.sourceFiles.length > 0) {
      setProjectKnowledge(existing);
    } else if (activeProject.files && activeProject.files.length > 0) {
      // Auto-extract knowledge for files that haven't been indexed yet (e.g. demo project)
      setIsProcessingKnowledge(true);
      projectContextService
        .rebuildProjectKnowledge(
          activeProject.id,
          activeProject.name,
          activeProject.files,
          activeProject.isDemo
        )
        .then((k) => {
          setProjectKnowledge(k);
        })
        .catch((err) => {
          console.error('[ProjectContext] Auto-index failed:', err);
        })
        .finally(() => {
          setIsProcessingKnowledge(false);
        });
    } else {
      setProjectKnowledge(null);
    }
  }, [activeProject?.id]);

  // Set active project and persist its ID
  const selectActiveProject = useCallback((project: Project | null) => {
    if (project) {
      const hydrated = {
        ...project,
        files: fileRepository.getFilesByProjectId(project.id, project.isDemo),
      };
      setActiveProject(hydrated);
      projectStorage.saveActiveProjectId(hydrated.id);
    } else {
      setActiveProject(null);
      projectStorage.saveActiveProjectId(null);
      setProjectKnowledge(null);
    }
  }, []);

  // Refresh active project files from isolated repository
  const refreshProjectFiles = useCallback(() => {
    if (!activeProject) return;
    const currentFiles = fileRepository.getFilesByProjectId(
      activeProject.id,
      activeProject.isDemo
    );
    const updated = {
      ...activeProject,
      files: currentFiles,
    };
    setActiveProject(updated);
    setProjects((prev) =>
      prev.map((p) => (p.id === activeProject.id ? updated : p))
    );
  }, [activeProject]);

  /**
   * Explicit action: Rebuild Project Context across all available documents
   */
  const rebuildActiveProjectKnowledge = useCallback(async () => {
    if (!activeProject) return;
    setIsProcessingKnowledge(true);

    try {
      const knowledge = await projectContextService.rebuildProjectKnowledge(
        activeProject.id,
        activeProject.name,
        activeProject.files,
        activeProject.isDemo
      );
      setProjectKnowledge(knowledge);
      toast.success(
        'Project Context Updated',
        `Rebuilt knowledge from ${knowledge.sourceFiles.length} file(s).`
      );
    } catch (err: any) {
      toast.error('Context Rebuild Failed', err.message || 'Could not re-extract project context.');
    } finally {
      setIsProcessingKnowledge(false);
    }
  }, [activeProject, toast]);

  const createProject = useCallback(
    (name: string, description: string = '', goal: string = ''): Project | null => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error('Validation Error', 'Project name is required.');
        return null;
      }

      const duplicate = projects.find(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.files.length === 0
      );
      if (duplicate) {
        toast.warning(
          'Existing Project Found',
          `"${trimmedName}" is already open in your local workspace.`
        );
        selectActiveProject(duplicate);
        return duplicate;
      }

      const now = new Date().toISOString();
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: trimmedName,
        title: trimmedName,
        description: description.trim(),
        goal: goal.trim(),
        createdAt: now,
        updatedAt: now,
        isDemo: false,
        category: 'Local Project Workspace',
        files: [],
        problem: '',
        solution: '',
        technologies: [],
        architectureConcepts: [],
        potentialTopics: [],
        summary: '',
        keyConcepts: [],
        architectureNotes: '',
        potentialQuestions: [],
      };

      const nextProjects = [newProj, ...projects];
      persistProjects(nextProjects);
      selectActiveProject(newProj);

      toast.success(
        'Project Created',
        `"${trimmedName}" initialized and set as your active local workspace.`
      );
      return newProj;
    },
    [projects, persistProjects, selectActiveProject, toast]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>): boolean => {
      if (id === AEGIS_JOURNAL_DEMO.id) {
        toast.warning('Read-Only Project', 'The built-in demo project details cannot be modified.');
        return false;
      }

      const existing = projects.find((p) => p.id === id);
      if (!existing) {
        toast.error('Project Not Found', `Cannot update project with ID: ${id}`);
        return false;
      }

      const now = new Date().toISOString();
      const updated: Project = {
        ...existing,
        ...updates,
        name: updates.name ? updates.name.trim() : existing.name,
        title: updates.name ? updates.name.trim() : existing.title,
        description:
          updates.description !== undefined ? updates.description.trim() : existing.description,
        goal: updates.goal !== undefined ? updates.goal.trim() : existing.goal,
        updatedAt: now,
      };

      const nextProjects = projects.map((p) => (p.id === id ? updated : p));
      persistProjects(nextProjects);

      if (activeProject?.id === id) {
        selectActiveProject(updated);
      }

      toast.success('Project Updated', `Changes to "${updated.name}" have been saved locally.`);
      return true;
    },
    [projects, activeProject, persistProjects, selectActiveProject, toast]
  );

  const deleteProject = useCallback(
    (id: string): boolean => {
      if (id === AEGIS_JOURNAL_DEMO.id) {
        toast.warning('Protected Demo', 'Aegis Journal demo project cannot be deleted.');
        return false;
      }

      const target = projects.find((p) => p.id === id);
      if (!target) {
        toast.error('Project Not Found', 'The project you attempted to delete does not exist.');
        return false;
      }

      // Clear all isolated files, knowledge, sessions, and history for this project
      storageService.deleteProjectFiles(id);
      projectKnowledgeRepository.clearKnowledgeByProjectId(id);
      judgeSessionRepository.clearSessions(id);
      voiceSessionRepository.clearSessions(id);
      readinessReportRepository.clearReports(id);
      preparationPlanRepository.clearPlans(id);
      chatHistoryService.clearHistory(id);

      const nextProjects = projects.filter((p) => p.id !== id);
      persistProjects(nextProjects);

      if (activeProject?.id === id) {
        const fallback = nextProjects[0] || null;
        selectActiveProject(fallback);
      }

      toast.info('Project Deleted', `"${target.name}" was removed from your local workspace.`);
      return true;
    },
    [projects, activeProject, persistProjects, selectActiveProject, toast]
  );

  const setActiveProjectById = useCallback(
    (id: string) => {
      if (id === AEGIS_JOURNAL_DEMO.id) {
        loadDemoProject();
        return;
      }
      const target = projects.find((p) => p.id === id);
      if (target) {
        selectActiveProject(target);
        toast.info('Active Project Switched', `Now working in "${target.name}".`);
      } else {
        toast.error('Project Switch Failed', `Could not find project with ID: ${id}`);
      }
    },
    [projects, selectActiveProject, toast]
  );

  const loadDemoProject = useCallback(() => {
    const exists = projects.some((p) => p.id === AEGIS_JOURNAL_DEMO.id);
    if (!exists) {
      const nextProjects = [AEGIS_JOURNAL_DEMO, ...projects];
      setProjects(nextProjects);
    }
    selectActiveProject(AEGIS_JOURNAL_DEMO);
    toast.info(
      'Demo Project Loaded',
      `Loaded "${AEGIS_JOURNAL_DEMO.name}" to preview Aegis workspace.`
    );
  }, [projects, selectActiveProject, toast]);

  const closeProject = useCallback(() => {
    selectActiveProject(null);
    toast.info('Project Closed', 'Returned to unassigned local workspace.');
  }, [selectActiveProject, toast]);

  /**
   * Import multiple files into the active project with extraction and knowledge generation.
   */
  const importFiles = useCallback(
    async (files: File[]): Promise<{ addedCount: number; failedCount: number }> => {
      if (files.length === 0) return { addedCount: 0, failedCount: 0 };

      if (activeProject?.isDemo) {
        toast.warning(
          'Demo Project Active',
          'Switch to or create a custom project to import your own local project files.'
        );
        return { addedCount: 0, failedCount: files.length };
      }

      let currentTarget = activeProject;

      if (!currentTarget) {
        const generatedTitle = files[0]?.name
          ? files[0].name.replace(/\.[^/.]+$/, '')
          : 'Imported Project';
        const now = new Date().toISOString();

        currentTarget = {
          id: `proj-${Date.now()}`,
          name: generatedTitle,
          title: generatedTitle,
          description: `Project context assembled from imported files.`,
          goal: 'Prepare presentation defense based on local files.',
          createdAt: now,
          updatedAt: now,
          files: [],
          isDemo: false,
          category: 'Local Project Workspace',
          problem: '',
          solution: '',
          technologies: [],
          architectureConcepts: [],
          potentialTopics: [],
          summary: '',
          keyConcepts: [],
          architectureNotes: '',
          potentialQuestions: [],
        };

        persistProjects([currentTarget, ...projects]);
        selectActiveProject(currentTarget);
      }

      let addedCount = 0;
      let failedCount = 0;
      const targetId = currentTarget.id;
      const targetName = currentTarget.name;

      setIsProcessingKnowledge(true);

      for (const file of files) {
        const duplicate = fileRepository.findDuplicateFile(targetId, file.name);
        const options: AddFileOptions = duplicate ? { resolution: 'keep_both' } : {};

        const result = await fileRepository.addFileToProject(targetId, file, options);
        if (result.success && result.projectFile) {
          addedCount++;
          // Pipeline Step: Extract & Analyze
          await projectContextService.processFile(targetId, targetName, file, false);
        } else {
          failedCount++;
          toast.error('Import Error', result.error || `Could not import "${file.name}"`);
        }
      }

      if (addedCount > 0) {
        const updatedFiles = fileRepository.getFilesByProjectId(targetId, false);
        const updatedProject: Project = {
          ...currentTarget,
          files: updatedFiles,
          updatedAt: new Date().toISOString(),
        };

        const nextProjects = projects.map((p) =>
          p.id === currentTarget!.id ? updatedProject : p
        );
        if (!projects.some((p) => p.id === currentTarget!.id)) {
          nextProjects.unshift(updatedProject);
        }
        persistProjects(nextProjects);
        setActiveProject(updatedProject);

        // Update active knowledge state
        const updatedKnowledge = projectKnowledgeRepository.getKnowledgeByProjectId(targetId);
        setProjectKnowledge(updatedKnowledge);

        toast.success(
          'Files Added',
          `Added ${addedCount} file(s). Project context updated.`
        );
      }

      setIsProcessingKnowledge(false);
      return { addedCount, failedCount };
    },
    [activeProject, projects, persistProjects, selectActiveProject, toast]
  );

  /**
   * Import a single file with explicit conflict resolution choice.
   */
  const importSingleFileWithResolution = useCallback(
    async (
      file: File,
      resolution: 'keep_both' | 'replace_existing'
    ): Promise<boolean> => {
      if (!activeProject || activeProject.isDemo) return false;

      setIsProcessingKnowledge(true);
      const result = await fileRepository.addFileToProject(activeProject.id, file, {
        resolution,
      });

      if (result.success && result.projectFile) {
        // Pipeline extraction
        await projectContextService.processFile(
          activeProject.id,
          activeProject.name,
          file,
          false
        );

        const updatedFiles = fileRepository.getFilesByProjectId(activeProject.id, false);
        const updatedProject: Project = {
          ...activeProject,
          files: updatedFiles,
          updatedAt: new Date().toISOString(),
        };

        const nextProjects = projects.map((p) =>
          p.id === activeProject.id ? updatedProject : p
        );
        persistProjects(nextProjects);
        setActiveProject(updatedProject);

        const updatedKnowledge = projectKnowledgeRepository.getKnowledgeByProjectId(activeProject.id);
        setProjectKnowledge(updatedKnowledge);

        toast.success(
          resolution === 'replace_existing' ? 'File Replaced' : 'File Saved',
          `"${result.projectFile.name}" updated in local project files and knowledge index.`
        );
        setIsProcessingKnowledge(false);
        return true;
      } else {
        toast.error('Import Failed', result.error || 'Could not save file.');
        setIsProcessingKnowledge(false);
        return false;
      }
    },
    [activeProject, projects, persistProjects, toast]
  );

  /**
   * Remove a file from the active project with immediate knowledge cleanup.
   */
  const removeProjectFile = useCallback(
    (fileId: string): boolean => {
      if (!activeProject) return false;

      if (activeProject.isDemo) {
        toast.warning('Demo Protected', 'Representative demo files cannot be deleted.');
        return false;
      }

      const success = fileRepository.removeFile(activeProject.id, fileId);
      if (success) {
        // Pipeline: remove from knowledge store and re-evaluate
        const updatedKnowledge = projectContextService.removeFileFromKnowledge(
          activeProject.id,
          activeProject.name,
          fileId
        );
        setProjectKnowledge(updatedKnowledge);

        const updatedFiles = fileRepository.getFilesByProjectId(activeProject.id, false);
        const updatedProject: Project = {
          ...activeProject,
          files: updatedFiles,
          updatedAt: new Date().toISOString(),
        };

        const nextProjects = projects.map((p) =>
          p.id === activeProject.id ? updatedProject : p
        );
        persistProjects(nextProjects);
        setActiveProject(updatedProject);

        toast.info(
          'File Removed',
          'File and its extracted knowledge were removed from the project workspace.'
        );
        return true;
      } else {
        toast.error('Removal Failed', 'Could not remove file from storage.');
        return false;
      }
    },
    [activeProject, projects, persistProjects, toast]
  );

  const projectContextData: ProjectContextModel = activeProject
    ? projectContextService.getContext(activeProject.id)
    : {
        projectId: '',
        overview: '',
        problem: '',
        solution: '',
        technologies: [],
        frameworks: [],
        languages: [],
        architecture: [],
        features: [],
        security: [],
        ai: [],
        potentialTopics: [],
        sources: [],
        lastUpdated: '',
        hasExtractedKnowledge: false,
      };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        hasProject: activeProject !== null,
        createProject,
        updateProject,
        deleteProject,
        setActiveProjectById,
        loadDemoProject,
        closeProject,
        importFiles,
        importSingleFileWithResolution,
        removeProjectFile,
        refreshProjectFiles,
        projectKnowledge,
        projectContextData,
        isProcessingKnowledge,
        rebuildActiveProjectKnowledge,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
