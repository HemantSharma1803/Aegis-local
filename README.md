# Aegis Local

> **Private On-Device AI Presentation & Defense Coach**  
> Engineered for competition-grade presentation readiness, on-device contextual knowledge retrieval, and Qualcomm Snapdragon X Elite / Copilot+ PC acceleration.

---

## Overview

**Aegis Local** transforms any hackathon, capstone, or pitch project into a private, on-device presentation-training workspace. Presenters and engineers can stage their slide decks, architectural whitepapers, and source code into an isolated local perimeter. Aegis Local then indexes this material into a grounded project knowledge engine, conducts realistic technical judge simulations, records verbal defense practices with real-time transcription, and synthesizes rubric-backed readiness reports—all while keeping proprietary project IP strictly confined to the local filesystem.

---

## The Problem Aegis Local Solves

1. **IP Exposure Risks**: Uploading unreleased competition intellectual property, patent-pending architectures, or confidential startup codebases to third-party public cloud LLMs risks proprietary leakage.
2. **Generic, Hallucinatory Feedback**: Standard chatbots provide generic advice because they lack verifiable citations to actual project artifacts and codebase files.
3. **High-Stakes Presentation Anxiety**: Technical presenters frequently struggle during Q&A when judges probe specific edge cases, scaling limits, or architectural trade-offs.
4. **Cloud Latency & Offline Dependency**: Pitch venues often suffer from congested WiFi, making cloud-dependent AI tools sluggish or unusable.

---

## How Aegis Local Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AEGIS LOCAL WORKSPACE                         │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│ 1. STAGE & INDEX│ 2. ASK AEGIS    │ 3. PREPARE ME    │ 4. JUDGE & VOICE│
│ PDF, PPTX, DOCX,│ Grounded Q&A    │ Structured plans,│ Simulated Q&A,  │
│ TXT, Markdown   │ with citation   │ technical Q&A    │ STT practice &  │
│ local extractor │ traceability    │ battlecards      │ readiness audit │
└────────┬────────┴────────┬────────┴────────┬─────────┴────────┬────────┘
         │                 │                 │                  │
         ▼                 ▼                 ▼                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   LOCAL CONTEXT & ISOLATION ENGINE                     │
│  - Namespaced local project stores (Zero cross-project leakage)        │
│  - Deterministic fallback rule-evaluators (Zero crash offline mode)    │
│  - Storage Quota & Health Inspector with automated orphan purger       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AI ARCHITECTURE ROUTER                           │
│  Resolves genuine hardware reality without fake claims:                │
│  1. Qualcomm Snapdragon Hexagon NPU (via QNN / ONNX Execution Provider)│
│  2. On-Device Local Host Runtime (CPU/GPU GGUF/DirectML via 127.0.0.1) │
│  3. Server Enclave Cloud Fallback (Strict opt-in only)                 │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Stage & Process**: Users drop project files (PDF, PPTX, DOCX, TXT, Markdown). Documents are extracted locally, chunked, and indexed with full source attribution.
2. **Ask Aegis**: A project-grounded chat workspace answering queries using verified file citations.
3. **Prepare Me**: Generates executive briefs, 60-second pitch elevator scripts, architectural breakdown cards, and anticipated judge queries.
4. **Simulate Judge Mode**: Multiple persona options (Skeptical Architect, Investor, Product Judge) grill the presenter with adaptive, multi-turn follow-ups and rubric scoring.
5. **Voice Practice**: Verbal defense drills with real-time speech-to-text, delivery timing, cadence analysis, and evidence-grounded rubric evaluations.
6. **Readiness Engine**: Computes transparent category scores across Architectural Depth, Defense Robustness, Delivery Clarity, and Evidence Grounding.

---

## Privacy Architecture & Guarantees

- **Local-First Sandbox**: Project files, knowledge index chunks, transcripts, and evaluation sessions are stored locally with strict `projectId` namespaces.
- **Strict Project Isolation**: Deleting a project purges all associated documents, knowledge chunks, sessions, and chat histories from local storage.
- **Zero-Fake Claims**: Aegis Local never claims "Snapdragon NPU active" unless runtime hardware probing explicitly detects the Qualcomm AI Engine on Windows ARM64.
- **Transparent Processing Location**: The application header and status indicators display the truthful processing mode: `Local / On-device`, `Snapdragon NPU`, `Cloud`, `Not configured`, or `Unknown / unavailable`.
- **Cloud Fallback Privacy Wall**: Remote AI fallback is gated behind an explicit user opt-in toggle in Privacy Settings.

---

## Snapdragon & Local AI Integration

Aegis Local is architecturally structured into four decoupled layers:
- **Provider Layer** (`AIProvider`): Uniform interface for text generation, embeddings, and structured JSON output.
- **Runtime Layer** (`SnapdragonRuntime`): Hardware probing, DirectML / QNN runtime bridge, and model lifecycle control.
- **Model Asset Layer** (`ModelRegistry`): Manages INT4/FP16 quantized ONNX and Qualcomm DLC model assets (e.g., Llama 3 8B Instruct, Phi-3 Mini 4K).
- **Execution Provider Layer**: Directly targets Qualcomm Hexagon Tensor Processor (HTP) on Snapdragon X Elite and Snapdragon X Plus platforms (up to 45 TOPS).

---

## System Requirements & Setup

### Development Environment
- Node.js 18+ (Node 20+ recommended)
- Modern browser with Web Speech API support (Google Chrome, Microsoft Edge)

### Production Target Hardware
- **Processor**: Snapdragon X Elite or Snapdragon X Plus (Windows 11 ARM64)
- **NPU**: Qualcomm Hexagon NPU (45 TOPS dedicated AI compute)
- **RAM**: 16 GB Unified Memory (minimum)
- **Runtime**: Windows 11 Build 26100+ with Qualcomm AI Engine & ONNX Runtime QNN EP

### Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production distribution
npm run build
```

## GitHub Pages Deployment

This project includes a GitHub Actions workflow for GitHub Pages. In the repository settings, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions** once before the first deployment.
