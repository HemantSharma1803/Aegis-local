import { ProjectFile } from '../types/file';

/**
 * Clean architectural interface for DocumentProcessor (Segment 4).
 * This establishes the security boundary:
 * FileSource -> FileRepository -> DocumentProcessor -> KnowledgeEngine
 */
export interface DocumentProcessor {
  isSupported(extension: string): boolean;
  extractText(file: File | ProjectFile): Promise<{ text: string; pageCount?: number; wordCount?: number }>;
  generateChecksum(file: File): Promise<string>;
}

/**
 * Clean architectural interface for KnowledgeEngine (Segment 5+).
 */
export interface KnowledgeEngine {
  indexDocument(projectId: string, fileId: string, text: string): Promise<boolean>;
  isDocumentIndexed(projectId: string, fileId: string): Promise<boolean>;
}

/**
 * Stub implementations for Segment 3 keeping boundaries clear
 * without fabricating results.
 */
export const documentProcessorStub: DocumentProcessor = {
  isSupported(extension: string) {
    return ['pdf', 'pptx', 'docx', 'txt', 'md'].includes(extension.toLowerCase());
  },
  async extractText() {
    throw new Error('DocumentProcessor is scheduled for implementation in Segment 4.');
  },
  async generateChecksum() {
    throw new Error('DocumentProcessor is scheduled for implementation in Segment 4.');
  },
};
