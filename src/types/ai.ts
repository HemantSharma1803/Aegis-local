/**
 * Types for AI Provider Abstraction, Local AI Architecture & Ask Aegis Grounded Assistant (Segment 10)
 */

export interface SourceReference {
  fileId?: string;
  fileName: string;
  wordCount?: number;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  timestamp: string;
  isGrounded?: boolean;
  isGeneralKnowledge?: boolean;
  providerName?: string;
  error?: boolean;
}

/**
 * Execution target for inference computation
 */
export type AIExecutionTarget = 'browser' | 'local-runtime' | 'Snapdragon-NPU' | 'cloud';

/**
 * Honest, observable processing location reported to UI
 */
export type AIProcessingLocation =
  | 'Local / On-device'
  | 'Snapdragon NPU'
  | 'Cloud'
  | 'Not configured'
  | 'Unknown / unavailable';

/**
 * Shorthand processing mode
 */
export type AIProcessingMode = 'local' | 'remote' | 'unconfigured' | 'snapdragon';

/**
 * Supported operations across the competition defense workspace
 */
export type AIOperation =
  | 'ask'
  | 'prepare'
  | 'judge'
  | 'voice-analysis'
  | 'summarize'
  | 'extract'
  | 'classify';

/**
 * Provider capabilities describing functional feature flags
 */
export interface AIProviderCapabilities {
  // Segment 10 capabilities
  textGeneration: boolean;
  streaming: boolean;
  embeddings: boolean;
  structuredJson: boolean;
  vision: boolean;
  speech: boolean;
  isLocal: boolean;
  isRemote: boolean;

  // Backward compatibility
  supportsStreaming?: boolean;
  supportsGrounding?: boolean;
  maxContextTokens?: number;
}

/**
 * Typed model configuration system
 */
export interface AIModelConfig {
  providerId: string;
  modelId: string;
  displayName: string;
  contextLength?: number;
  capabilities: AIProviderCapabilities;
  executionTarget: AIExecutionTarget;
  quantization?: string;
  recommendedHardware?: string;
  notes?: string;
}

/**
 * Detailed status model for runtime availability and diagnostic state
 */
export interface AIProviderStatus {
  id: string;
  name: string;
  available: boolean;
  configured: boolean;
  local: boolean;
  model: string;
  executionTarget: AIExecutionTarget;
  processingLocation: AIProcessingLocation;
  message: string;
  capabilities: AIProviderCapabilities;
  hardwareTarget?: string;
  missingRequirements?: string[];
  lastChecked?: number;
}

/**
 * Structured request context
 */
export interface AIRequestContext {
  systemContextPrompt: string;
  overview?: string;
  problem?: string;
  solution?: string;
  technologies: string[];
  frameworks: string[];
  languages: string[];
  architecture: string[];
  security: string[];
  sourceAttributions: SourceReference[];
  documentSnippets?: {
    fileName: string;
    text: string;
  }[];
  [key: string]: any;
}

/**
 * Standard structured AI Request model
 */
export interface AIRequest {
  operation?: AIOperation;
  projectId: string;
  projectName?: string;
  question?: string; // backward compat with Ask Aegis
  prompt?: string;
  context: AIRequestContext;
  conversationHistory?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  responseFormat?: 'text' | 'json';
  temperature?: number;
  metadata?: Record<string, any>;
}

/**
 * Standard structured AI Response model
 */
export interface AIResponse<T = any> {
  answer: string;
  data?: T;
  sources: SourceReference[];
  provider: string;
  providerId?: string;
  processingMode?: AIProcessingLocation;
  executionTarget?: AIExecutionTarget;
  grounded: boolean;
  isGeneralKnowledge?: boolean;
  error?: string;
  timestamp?: string;
}

/**
 * Core AI Provider Interface
 */
export interface AIProvider {
  id: string;
  name: string;
  capabilities: AIProviderCapabilities;
  modelConfig: AIModelConfig;

  status(): Promise<AIProviderStatus>;
  isAvailable(): Promise<boolean> | boolean;

  generate<T = any>(request: AIRequest): Promise<AIResponse<T>>;
  stream?(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;

  // Backward-compatible specialized delegation signatures
  answerQuestion(request: AIRequest): Promise<AIResponse>;
  streamQuestion?(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;
  generatePreparationPlan?(request: any): Promise<any>;
  generateJudgeQuestion?(request: any): Promise<any>;
  evaluateJudgeAnswer?(request: any): Promise<any>;
  summarizeJudgeSession?(request: any): Promise<any>;
  analyzeVoicePractice?(request: any): Promise<any>;
}

