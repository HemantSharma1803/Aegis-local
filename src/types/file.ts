export type FileProcessingStatus = 'ready' | 'processing' | 'needs_attention' | 'error';

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  formattedSize?: string;
  addedAt: string;
  status: FileProcessingStatus;
  path: string;
  isDemoFile?: boolean;

  // Stubs for future pipeline stages (documentProcessor, knowledgeEngine)
  // Kept empty/undefined in Segment 3 without fabricated values
  extractedText?: string;
  pageCount?: number;
  wordCount?: number;
  checksum?: string;
  embeddingStatus?: 'pending' | 'indexed' | 'skipped';
  knowledgeStatus?: 'unprocessed' | 'indexed' | 'failed';
  errorMessage?: string;
}

export type SupportedFileExtension = 'pdf' | 'pptx' | 'docx' | 'txt' | 'md';

export const SUPPORTED_EXTENSIONS: SupportedFileExtension[] = ['pdf', 'pptx', 'docx', 'txt', 'md'];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB standard limit for local project files

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface DuplicateFileConflict {
  file: File;
  existingFile: ProjectFile;
}

export type DuplicateResolutionAction = 'keep_both' | 'replace_existing';
