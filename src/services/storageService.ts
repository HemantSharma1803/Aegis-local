import {
  ProjectFile,
  SupportedFileExtension,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  FileValidationResult,
} from '../types/file';

/**
 * Storage keys for project file manifests.
 * Keeps file metadata separated by project ID to ensure absolute project isolation.
 */
const STORAGE_PREFIX_FILES = 'aegis_local_project_files_';

/**
 * Clean storage abstraction layer.
 * In the current browser environment, handles metadata persistence reliably.
 * In desktop distribution, maps directly to Tauri fs / SQLite store.
 */
export const storageService = {
  getFilesKey(projectId: string): string {
    return `${STORAGE_PREFIX_FILES}${projectId}`;
  },

  loadProjectFiles(projectId: string): ProjectFile[] {
    try {
      const key = this.getFilesKey(projectId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      console.warn(`[storageService] Failed to load files for project ${projectId}:`, err);
      return [];
    }
  },

  saveProjectFiles(projectId: string, files: ProjectFile[]): boolean {
    try {
      const key = this.getFilesKey(projectId);
      localStorage.setItem(key, JSON.stringify(files));
      return true;
    } catch (err) {
      console.error(`[storageService] Failed to save files for project ${projectId}:`, err);
      return false;
    }
  },

  deleteProjectFiles(projectId: string): boolean {
    try {
      const key = this.getFilesKey(projectId);
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[storageService] Failed to clear files for project ${projectId}:`, err);
      return false;
    }
  },
};

/**
 * File validation helpers
 */
export function validateFile(file: File): FileValidationResult {
  // 1. Filename validation
  const name = file.name ? file.name.trim() : '';
  if (!name) {
    return { valid: false, error: 'File has an empty or invalid filename.' };
  }

  // 2. Extension validation
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === name.length - 1) {
    return {
      valid: false,
      error: `This file type isn't supported yet. Aegis supports PDF, PPTX, DOCX, TXT, and MD.`,
    };
  }

  const ext = name.slice(dotIndex + 1).toLowerCase() as SupportedFileExtension;
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `This file type (".${ext}") isn't supported yet. Please import PDF, PPTX, DOCX, TXT, or MD files.`,
    };
  }

  // 3. Empty file check
  if (file.size === 0) {
    return {
      valid: false,
      error: `"${name}" is empty (0 bytes). Please select a file with content.`,
    };
  }

  // 4. File size limits
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${name}" exceeds the maximum supported file size of 50 MB (${sizeMb} MB detected).`,
    };
  }

  return { valid: true };
}

/**
 * Format bytes to readable human string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  return `${val} ${sizes[i]}`;
}

/**
 * Resolve friendly type name from extension
 */
export function getFriendlyFileType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'PDF Document';
    case 'pptx':
      return 'PowerPoint Presentation';
    case 'docx':
      return 'Word Document';
    case 'txt':
      return 'Plain Text Document';
    case 'md':
      return 'Markdown Document';
    default:
      return 'Project Document';
  }
}

export interface StorageCategoryStats {
  count: number;
  bytes: number;
}

export interface StorageHealthReport {
  totalBytes: number;
  formattedTotal: string;
  itemCount: number;
  quotaWarning: boolean;
  categories: {
    projects: StorageCategoryStats;
    files: StorageCategoryStats;
    knowledge: StorageCategoryStats;
    judgeSessions: StorageCategoryStats;
    voiceSessions: StorageCategoryStats;
    readinessReports: StorageCategoryStats;
    chatHistory: StorageCategoryStats;
    other: StorageCategoryStats;
  };
  orphanedKeysCount: number;
}

export function calculateStorageHealth(knownProjectIds: string[]): StorageHealthReport {
  const categories = {
    projects: { count: 0, bytes: 0 },
    files: { count: 0, bytes: 0 },
    knowledge: { count: 0, bytes: 0 },
    judgeSessions: { count: 0, bytes: 0 },
    voiceSessions: { count: 0, bytes: 0 },
    readinessReports: { count: 0, bytes: 0 },
    chatHistory: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 },
  };

  let totalBytes = 0;
  let itemCount = 0;
  let orphanedKeysCount = 0;
  const knownSet = new Set(knownProjectIds);

  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const value = localStorage.getItem(key) || '';
        const keyBytes = (key.length + value.length) * 2; // UTF-16
        totalBytes += keyBytes;
        itemCount++;

        // Categorize Aegis-managed keys
        if (key === 'aegis_local_projects') {
          categories.projects.count++;
          categories.projects.bytes += keyBytes;
        } else if (key.startsWith('aegis_local_project_files_')) {
          categories.files.count++;
          categories.files.bytes += keyBytes;
          const pid = key.replace('aegis_local_project_files_', '');
          if (knownSet.size > 0 && !knownSet.has(pid)) orphanedKeysCount++;
        } else if (key.startsWith('aegis_local_knowledge_') || key.startsWith('aegis_local_doc_')) {
          categories.knowledge.count++;
          categories.knowledge.bytes += keyBytes;
          const pid = key.replace('aegis_local_knowledge_', '');
          if (knownSet.size > 0 && !knownSet.has(pid) && !key.startsWith('aegis_local_doc_')) {
            orphanedKeysCount++;
          }
        } else if (key.startsWith('aegis_local_judge_sessions_')) {
          categories.judgeSessions.count++;
          categories.judgeSessions.bytes += keyBytes;
          const pid = key.replace('aegis_local_judge_sessions_', '');
          if (knownSet.size > 0 && !knownSet.has(pid)) orphanedKeysCount++;
        } else if (key.startsWith('aegis_local_voice_sessions_')) {
          categories.voiceSessions.count++;
          categories.voiceSessions.bytes += keyBytes;
          const pid = key.replace('aegis_local_voice_sessions_', '');
          if (knownSet.size > 0 && !knownSet.has(pid)) orphanedKeysCount++;
        } else if (key.startsWith('aegis_local_readiness_reports_')) {
          categories.readinessReports.count++;
          categories.readinessReports.bytes += keyBytes;
          const pid = key.replace('aegis_local_readiness_reports_', '');
          if (knownSet.size > 0 && !knownSet.has(pid)) orphanedKeysCount++;
        } else if (key.startsWith('aegis_local_chat_history_') || key.startsWith('aegis_chat_')) {
          categories.chatHistory.count++;
          categories.chatHistory.bytes += keyBytes;
          const pid = key.replace('aegis_local_chat_history_', '').replace('aegis_chat_', '');
          if (knownSet.size > 0 && !knownSet.has(pid)) orphanedKeysCount++;
        } else if (key.startsWith('aegis_')) {
          categories.other.count++;
          categories.other.bytes += keyBytes;
        }
      }
    }
  } catch (err) {
    console.warn('[storageService] Failed to calculate storage health:', err);
  }

  // LocalStorage typical quota is ~5-10MB; warn at 4MB
  const quotaWarning = totalBytes > 4 * 1024 * 1024;

  return {
    totalBytes,
    formattedTotal: formatBytes(totalBytes),
    itemCount,
    quotaWarning,
    categories,
    orphanedKeysCount,
  };
}

export function purgeOrphanedProjectData(knownProjectIds: string[]): number {
  let purgedCount = 0;
  if (typeof localStorage === 'undefined' || knownProjectIds.length === 0) return 0;
  const knownSet = new Set(knownProjectIds);

  const keysToCheck: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('aegis_local_')) {
      keysToCheck.push(key);
    }
  }

  for (const key of keysToCheck) {
    let projectIdCandidate = '';
    if (key.startsWith('aegis_local_project_files_')) {
      projectIdCandidate = key.replace('aegis_local_project_files_', '');
    } else if (key.startsWith('aegis_local_knowledge_')) {
      projectIdCandidate = key.replace('aegis_local_knowledge_', '');
    } else if (key.startsWith('aegis_local_judge_sessions_')) {
      projectIdCandidate = key.replace('aegis_local_judge_sessions_', '');
    } else if (key.startsWith('aegis_local_voice_sessions_')) {
      projectIdCandidate = key.replace('aegis_local_voice_sessions_', '');
    } else if (key.startsWith('aegis_local_readiness_reports_')) {
      projectIdCandidate = key.replace('aegis_local_readiness_reports_', '');
    } else if (key.startsWith('aegis_local_chat_history_')) {
      projectIdCandidate = key.replace('aegis_local_chat_history_', '');
    }

    if (projectIdCandidate && !knownSet.has(projectIdCandidate)) {
      try {
        localStorage.removeItem(key);
        purgedCount++;
      } catch (err) {
        console.warn(`[storageService] Failed to remove orphaned key ${key}:`, err);
      }
    }
  }

  return purgedCount;
}
