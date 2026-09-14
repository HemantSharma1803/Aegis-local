export type NavPage =
  | 'home'
  | 'project'
  | 'ask-aegis'
  | 'prepare-me'
  | 'judge-mode'
  | 'voice-practice'
  | 'readiness'
  | 'privacy'
  | 'settings';

export * from './file';
export * from './knowledge';
export * from './ai';
export * from './prepare';
export * from './judge';
export * from './readiness';
export * from './voice';
import { ProjectFile } from './file';

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  category?: string;

  // Structured project knowledge concepts (for demo or future parsing engine)
  problem?: string;
  solution?: string;
  technologies?: string[];
  architectureConcepts?: string[];
  potentialTopics?: string[];
  files: ProjectFile[];

  // Compatibility aliases for Segment 1 components
  title?: string;
  tagline?: string;
  summary?: string;
  keyConcepts?: string[];
  architectureNotes?: string;
  potentialQuestions?: string[];
}

export type ProjectContextData = Project;

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
}

export interface AppSettings {
  aiProvider: 'on-device-qnn' | 'local-llm-runtime' | 'direct-mock';
  processingMode: 'balanced' | 'high-performance' | 'low-power';
  storagePath: string;
  telemetryEnabled: boolean;
  strictContextIsolation: boolean;
  appearance: 'dark' | 'system' | 'compact';
}
