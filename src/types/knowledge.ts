/**
 * Type definitions for Document Processing and Project Knowledge Engine (Segment 4)
 */

export interface ExtractedDocument {
  fileId: string;
  projectId: string;
  text: string;
  title?: string;
  pageCount?: number;
  wordCount: number;
  charCount: number;
  extractedAt: string;
  processor: string;
  checksum?: string;
  isDemoFile?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  document?: ExtractedDocument;
  error?: string;
  unsupportedReason?: string;
  isSupported: boolean;
}

export interface DocumentProcessor {
  id: string;
  name: string;
  supportedExtensions: string[];
  isSupported(extension: string): boolean;
  canExtract(): boolean;
  extractText(
    file: File | { id: string; name: string; extension: string; size: number },
    projectId: string,
    fileId: string,
    fallbackText?: string
  ): Promise<ProcessingResult>;
}

export type KnowledgeItemType =
  | 'overview'
  | 'problem'
  | 'solution'
  | 'technology'
  | 'framework'
  | 'language'
  | 'architecture'
  | 'feature'
  | 'security'
  | 'ai_concept'
  | 'defense_topic';

export type KnowledgeConfidence = 'exact' | 'high_heuristic' | 'heuristic' | 'inferred';

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  value: string;
  sourceFileId?: string;
  sourceFileName?: string;
  confidence: KnowledgeConfidence;
  category?: string;
  contextSnippet?: string;
}

export interface ProjectKnowledge {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  problemStatement?: string;
  proposedSolution?: string;
  goals?: string[];
  technologies: string[];
  frameworks: string[];
  programmingLanguages: string[];
  architectureConcepts: string[];
  features: string[];
  importantTerms: string[];
  securityConcepts: string[];
  aiConcepts: string[];
  potentialTopics: string[];
  sourceFiles: {
    fileId: string;
    fileName: string;
    wordCount: number;
    extractedAt: string;
  }[];
  rawItems: KnowledgeItem[];
  generatedAt: string;
  totalWordCount: number;
}

export interface ProjectContext {
  projectId: string;
  overview: string;
  problem: string;
  solution: string;
  technologies: string[];
  frameworks: string[];
  languages: string[];
  architecture: string[];
  features: string[];
  security: string[];
  ai: string[];
  potentialTopics: string[];
  sources: {
    fileId: string;
    fileName: string;
    wordCount: number;
  }[];
  lastUpdated: string;
  hasExtractedKnowledge: boolean;
}

export type EngineProcessingState = 'idle' | 'extracting' | 'analyzing' | 'ready' | 'needs_attention' | 'failed';
