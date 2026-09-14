export type VoicePracticeMode =
  | 'pitch-60'
  | 'project-overview'
  | 'technical-answer'
  | 'judge-question';

export interface VoicePracticePrompt {
  id: string;
  mode: VoicePracticeMode;
  category: string;
  title: string;
  promptText: string;
  guidance: string[];
  maxDurationSeconds: number; // 60 for pitch-60, 180 for others
  sourceQuestionId?: string;
  sourceTopicId?: string;
}

export interface VoicePracticeResult {
  mode: VoicePracticeMode;
  transcript: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  missingPoints: string[];
  projectEvidence: string[];
  recommendedPractice: string[];
  accuracyScore: number; // 1 to 5
  clarityScore: number; // 1 to 5
  defenseScore: number; // 1 to 5
  overallRubricScore: number; // 1 to 5
  primaryCategory: 'understanding' | 'clarity' | 'defense' | 'architecture' | 'questions';
}

export interface VoicePracticeSession {
  id: string;
  projectId: string;
  createdAt: string;
  prompt: VoicePracticePrompt;
  transcript: string;
  durationSeconds: number;
  result?: VoicePracticeResult;
  providerName: string;
  processingMode: 'local' | 'remote';
  audioRecorded: boolean; // Confirms user spoke during recording; raw audio is discarded immediately
}

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface SpeechToTextEvents {
  onResult: (payload: SpeechRecognitionResultPayload) => void;
  onError: (error: { code: string; message: string; originalError?: any }) => void;
  onStart: () => void;
  onEnd: () => void;
  onAudioLevel?: (level: number) => void;
}

export interface SpeechToTextProvider {
  id: string;
  name: string;
  description: string;
  isSupported(): boolean;
  getUnavailabilityReason?(): string;
  start(events: SpeechToTextEvents): Promise<void>;
  stop(): Promise<void>;
  abort(): void;
  isListening(): boolean;
}
