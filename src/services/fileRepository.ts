import { ProjectFile } from '../types/file';
import { DEMO_PROJECT_FILES } from '../data/demoFiles';
import {
  storageService,
  validateFile,
  formatBytes,
  getFriendlyFileType,
} from './storageService';

/**
 * In-memory cache for active session binary/text Blobs.
 * This separates binary storage cleanly from localStorage metadata,
 * allowing instant local reading/preview during the active session
 * while persisting file manifest metadata across page reloads.
 */
class FileSessionCache {
  private cache: Map<string, { file?: File; textContent?: string }> = new Map();

  setFile(fileId: string, file: File) {
    this.cache.set(fileId, { file });
  }

  getFile(fileId: string): File | undefined {
    return this.cache.get(fileId)?.file;
  }

  setTextContent(fileId: string, text: string) {
    const existing = this.cache.get(fileId) || {};
    this.cache.set(fileId, { ...existing, textContent: text });
  }

  getTextContent(fileId: string): string | undefined {
    return this.cache.get(fileId)?.textContent;
  }

  delete(fileId: string) {
    this.cache.delete(fileId);
  }
}

const sessionCache = new FileSessionCache();

export interface AddFileOptions {
  resolution?: 'keep_both' | 'replace_existing';
}

/**
 * FileRepository encapsulates all project file operations.
 * It enforces project isolation and keeps storage clean and testable.
 */
export const fileRepository = {
  /**
   * Get all files for a specific project.
   * If the project is the demo project, returns DEMO_PROJECT_FILES (never mixed into user storage).
   */
  getFilesByProjectId(projectId: string, isDemo: boolean = false): ProjectFile[] {
    if (isDemo || projectId === 'demo-aegis-journal') {
      return [...DEMO_PROJECT_FILES];
    }
    return storageService.loadProjectFiles(projectId);
  },

  /**
   * Add a new file to a project with full validation and metadata creation.
   */
  async addFileToProject(
    projectId: string,
    file: File,
    options: AddFileOptions = {}
  ): Promise<{ success: boolean; projectFile?: ProjectFile; error?: string }> {
    // 1. Validation
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Load existing files to check for duplicate filenames
    const existingFiles = storageService.loadProjectFiles(projectId);
    const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
    const existingIndex = existingFiles.findIndex(
      (f) => f.name.toLowerCase() === file.name.toLowerCase()
    );

    let finalName = file.name;
    let targetFiles = [...existingFiles];
    let fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (existingIndex !== -1) {
      if (options.resolution === 'replace_existing') {
        // Replace existing: keep existing id and replace metadata
        const existing = existingFiles[existingIndex];
        fileId = existing.id;
        finalName = existing.name;
        targetFiles = existingFiles.filter((_, idx) => idx !== existingIndex);
      } else if (options.resolution === 'keep_both') {
        // Generate disambiguated name: e.g. "spec (1).md"
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        let counter = 1;
        while (
          existingFiles.some(
            (f) => f.name.toLowerCase() === `${baseName} (${counter}).${ext}`.toLowerCase()
          )
        ) {
          counter++;
        }
        finalName = `${baseName} (${counter}).${ext}`;
      } else {
        // No resolution specified: conflict detected
        return {
          success: false,
          error: `A file named "${file.name}" already exists in this project.`,
        };
      }
    }

    // 3. Construct clean ProjectFile model
    const now = new Date().toISOString();
    const newProjectFile: ProjectFile = {
      id: fileId,
      projectId,
      name: finalName,
      type: getFriendlyFileType(ext),
      extension: ext,
      size: file.size,
      formattedSize: formatBytes(file.size),
      addedAt: now,
      status: 'ready', // Ready in local project file system (NOT "AI understood")
      path: `/${finalName}`,
      isDemoFile: false,
    };

    // Retain file in session cache for preview/reading
    sessionCache.setFile(fileId, file);

    // If it's a text-based file (txt, md), cache text content for instant preview
    if (ext === 'txt' || ext === 'md') {
      try {
        const text = await file.text();
        sessionCache.setTextContent(fileId, text);
      } catch (err) {
        console.warn(`Could not cache text preview for ${finalName}:`, err);
      }
    }

    targetFiles.push(newProjectFile);
    storageService.saveProjectFiles(projectId, targetFiles);

    return { success: true, projectFile: newProjectFile };
  },

  /**
   * Check if a filename already exists in the project.
   */
  findDuplicateFile(projectId: string, filename: string): ProjectFile | undefined {
    const files = storageService.loadProjectFiles(projectId);
    return files.find((f) => f.name.toLowerCase() === filename.toLowerCase());
  },

  /**
   * Remove a file from a project.
   */
  removeFile(projectId: string, fileId: string): boolean {
    const existing = storageService.loadProjectFiles(projectId);
    const filtered = existing.filter((f) => f.id !== fileId);
    sessionCache.delete(fileId);
    return storageService.saveProjectFiles(projectId, filtered);
  },

  /**
   * Get text content for preview if available (for txt, md).
   */
  async getFilePreviewContent(file: ProjectFile): Promise<{
    hasPreview: boolean;
    content?: string;
    reason?: string;
  }> {
    if (file.isDemoFile) {
      if (file.name === 'README.md') {
        return {
          hasPreview: true,
          content: `# Aegis Journal\n\nZero-knowledge client-side privacy architecture with on-device reasoning and AI mood assistance.\n\n## Core Principles\n- Client-Side Encryption: AES-GCM (256-bit) with PBKDF2 key derivation.\n- Isolation: No unencrypted entries leave the client perimeter.\n- Local Defense: Prepares engineering teams to defend architecture decisions.\n\n*Note: This is a representative demo file for the Aegis Journal reference project.*`,
        };
      }
      if (file.name === 'architecture.md') {
        return {
          hasPreview: true,
          content: `# Aegis Journal Architecture Specification\n\n## Threat Model & Boundaries\n- Client: Browser sandboxed execution or desktop enclave.\n- Transport: TLS 1.3 encrypted tunnel.\n- Storage: Encrypted ciphertext envelopes only; zero access to key material.\n\n## Cryptographic Primitives\n1. Key Derivation: PBKDF2 with HMAC-SHA256, 100,000 iterations.\n2. Symmetric Encryption: AES-256-GCM with 96-bit unique IV per record.\n3. Envelope Verification: GCM authentication tag verified prior to decryption.`,
        };
      }
      if (file.name === 'security-notes.md') {
        return {
          hasPreview: true,
          content: `# Security Analysis & Defense Notes\n\n## Trade-offs Considered\n- Why AES-GCM over CBC: Integrated authentication tag eliminates padding oracle vulnerabilities.\n- Why PBKDF2: Standardized WebCrypto support; resist dictionary scans.\n- AI Boundary: Extraction executes within client memory perimeter before tokenization.`,
        };
      }
      return {
        hasPreview: false,
        reason: 'Preview is not available for this demo resource.',
      };
    }

    const cachedText = sessionCache.getTextContent(file.id);
    if (cachedText !== undefined) {
      return { hasPreview: true, content: cachedText };
    }

    const cachedFile = sessionCache.getFile(file.id);
    if (cachedFile && (file.extension === 'txt' || file.extension === 'md')) {
      try {
        const text = await cachedFile.text();
        sessionCache.setTextContent(file.id, text);
        return { hasPreview: true, content: text };
      } catch (err) {
        return {
          hasPreview: false,
          reason: 'Failed to read file content from local session.',
        };
      }
    }

    if (file.extension === 'pdf' || file.extension === 'docx' || file.extension === 'pptx') {
      return {
        hasPreview: false,
        reason: `In-app text preview for binary .${file.extension.toUpperCase()} documents will be activated in the upcoming Document Processor stage. The file metadata is safely recorded in your project manifest.`,
      };
    }

    return {
      hasPreview: false,
      reason: 'Text preview is not available for this session. (File was imported in an earlier session; re-importing allows instant in-session preview).',
    };
  },
};
