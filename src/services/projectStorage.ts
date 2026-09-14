import { Project } from '../types';
import { AEGIS_JOURNAL_DEMO } from '../data/demoProject';

const STORAGE_KEY_PROJECTS = 'aegis_local_projects_v2';
const STORAGE_KEY_ACTIVE_ID = 'aegis_local_active_project_id_v2';

/**
 * Storage abstraction for Aegis Local projects.
 * Uses browser localStorage currently, designed to be swapped cleanly
 * with Tauri SQLite / encrypted local filesystem store in desktop distribution.
 */
export const projectStorage = {
  /**
   * Retrieve all saved projects.
   * Returns empty array if none saved or upon parse failure.
   */
  getAllProjects(): Project[] {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (!serialized) {
        return [];
      }
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch (error) {
      console.warn('[Aegis Storage] Failed to load projects from storage:', error);
      return [];
    }
  },

  /**
   * Persist full projects collection to storage.
   * Filters out or safely marks demo projects as appropriate.
   */
  saveAllProjects(projects: Project[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      return true;
    } catch (error) {
      console.error('[Aegis Storage] Failed to save projects to storage:', error);
      return false;
    }
  },

  /**
   * Get active project ID.
   */
  getActiveProjectId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    } catch (error) {
      console.warn('[Aegis Storage] Failed to get active project id:', error);
      return null;
    }
  },

  /**
   * Save active project ID.
   */
  saveActiveProjectId(id: string | null): boolean {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
      return true;
    } catch (error) {
      console.error('[Aegis Storage] Failed to persist active project id:', error);
      return false;
    }
  },

  /**
   * Clear all local storage for projects.
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PROJECTS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    } catch (error) {
      console.error('[Aegis Storage] Failed to clear project storage:', error);
    }
  },
};
