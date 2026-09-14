# Aegis Local — Technical Architecture Specification

This document details the architectural design, isolation guarantees, and runtime pipelines powering **Aegis Local**.

---

## 1. High-Level Architecture

Aegis Local decouples user presentation workflows from concrete execution backends:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & UI LAYER                         │
│   Topbar (Hardware & Status) • Sidebar Navigation • Error Boundary     │
│   Ask Aegis • Prepare Me • Judge Mode • Voice Practice • Readiness     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION DOMAIN SERVICE LAYER                    │
│   ProjectContextService • ProjectKnowledgeEngine • DocumentParsers    │
│   JudgeSimulationService • VoicePracticeService • ReadinessService    │
│   PreparationContextBuilder • SpeechToTextRegistry                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     AI ROUTING & PRIVACY BOUNDARY                      │
│   AIProviderRouter (Hardware priority resolution & fallback gating)    │
│   PrivacyBoundary (Cloud opt-in policy & transparent location reporting)│
│   ProjectIsolation (Scoping & sanitization of diagnostic payloads)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│SnapdragonProvider│       │  LocalProvider  │       │ GeminiProvider  │
│(QNN / ONNX EP)  │       │(CPU/GPU Runtime)│       │ (Server Enclave)│
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
 Qualcomm Hexagon NPU       Localhost 127.0.0.1      HTTPS /api/ai/* Proxy
   (Snapdragon ARM64)       (GGUF / DirectML)         (Gated Opt-In)
```

---

## 2. AI Provider & Hardware Abstraction Layer

All AI execution implements the unified `AIProvider` contract (`src/types/ai.ts`):

```typescript
export interface AIProvider {
  id: string;
  name: string;
  capabilities: AIProviderCapabilities;
  modelConfig: AIModelConfig;
  isAvailable(): Promise<boolean>;
  status(): Promise<AIProviderStatus>;
  generate<T>(request: AIRequest): Promise<AIResponse<T>>;
}
```

### Routing Hierarchy (`AIProviderRouter.ts`)
1. **Explicit Selection**: If the user pins a specific provider in Settings, that provider is prioritized without silent rerouting.
2. **Snapdragon NPU**: Probes `snapdragonRuntime.detect()`. Active only when Qualcomm Hexagon NPU hardware is verified.
3. **Local Host Runtime**: Probes `127.0.0.1:11434` for local ONNX/GGUF runtime daemons.
4. **Cloud Enclave**: Active only if server API credentials exist **and** the user has opted in via `PrivacyBoundary.isCloudOptInAllowed()`.
5. **Deterministic Grounded Fallback**: If no AI backend is active, local domain rule-evaluators synthesize responses directly from project evidence, guaranteeing zero runtime crashes.

---

## 3. Storage & Project Isolation Model

Data persistence in Aegis Local guarantees complete project segregation:

| Domain | Key Pattern | Isolation Mechanism |
| :--- | :--- | :--- |
| **Projects** | `aegis_local_projects` | Top-level project manifest directory |
| **Files** | `aegis_local_project_files_{projectId}` | Scoped to active project |
| **Knowledge Chunks** | `aegis_local_knowledge_{projectId}` | Isolated structured knowledge & keyword indices |
| **Judge Sessions** | `aegis_local_judge_sessions_{projectId}` | Multi-turn Q&A transcripts & rubric logs |
| **Voice Sessions** | `aegis_local_voice_sessions_{projectId}` | Verbal defense transcripts & scores |
| **Readiness Reports** | `aegis_local_readiness_reports_{projectId}` | Historical and active audit reports |
| **Chat History** | `aegis_local_chat_history_{projectId}` | Project-scoped chat memory |

### Deletion & Cleanup Guarantee
When a project is deleted via `ProjectContext.deleteProject(id)`:
1. File manifests are removed (`storageService.deleteProjectFiles`).
2. Knowledge chunks and document indices are purged (`projectKnowledgeRepository.clearKnowledgeByProjectId`).
3. Judge sessions are deleted (`judgeSessionRepository.clearSessions`).
4. Voice practice sessions are deleted (`voiceSessionRepository.clearSessions`).
5. Readiness reports are deleted (`readinessReportRepository.clearReports`).
6. Preparation plans are deleted (`preparationPlanRepository.clearPlans`).
7. Chat histories are deleted (`chatHistoryService.clearHistory`).
8. The Storage Health Inspector (`purgeOrphanedProjectData`) provides automated sweeping for any orphaned keys.

---

## 4. Voice Practice & Speech-To-Text Pipeline

The verbal practice engine captures presenter speech without external cloud leaks:

1. **Hardware Capture**: Requests microphone access via `navigator.mediaDevices.getUserMedia` with echo cancellation and noise suppression.
2. **Real-Time Level Meter**: Analyzes frequency distribution via Web Audio `AnalyserNode`. Updates are throttled to 20fps to protect 60fps UI rendering.
3. **Speech Recognition**: Uses `BrowserSpeechProvider` (Web Speech API) with continuous recognition and interim result streaming.
4. **Lifecycle Safety**:
   - Explicit `stop()` and `abort()` methods release all MediaStream tracks and close the `AudioContext`.
   - `VoicePracticePage` features an unmount cleanup hook ensuring microphone listeners never remain active after leaving the view.
   - Raw audio waveforms are never saved or transmitted—only derived textual transcripts are analyzed.

---

## 5. Readiness Scoring Methodology

Readiness scores are computed through transparent, rubric-backed evaluation:

- **Architectural Depth (25%)**: Assesses technical clarity, component boundaries, trade-off understanding, and knowledge grounding.
- **Defense Robustness (25%)**: Measures consistency under adversarial questioning, handling of edge cases, and recovery from challenge prompts.
- **Delivery Clarity (25%)**: Evaluates verbal conciseness, pacing (words per minute), filler-word suppression, and structured articulation.
- **Evidence Grounding (25%)**: Verifies that assertions are anchored in documented project files rather than ungrounded claims.

If no sessions have been conducted, the Readiness page honestly reports an unassessed state rather than generating fabricated scores.
