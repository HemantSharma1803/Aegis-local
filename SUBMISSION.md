# Aegis Local — Competition Submission Brief

## 1. Project Summary

**Aegis Local** is a private, on-device AI presentation and defense workspace built for engineers, researchers, and hackathon competitors preparing for high-stakes presentations. By pairing local document knowledge extraction with realistic judge simulations, real-time verbal practice drills, and quantitative readiness scoring, Aegis Local equips presenters to defend complex technical systems with confidence—while keeping proprietary codebases and whitepapers strictly within a local perimeter.

---

## 2. Key Innovations

1. **Grounded Multi-Modal Document Extraction**: Extracts and normalizes complex project slides (PPTX), whitepapers (PDF), architecture specs (DOCX), and technical readmes (Markdown/TXT) directly on-device with zero cloud dependencies.
2. **Transparent Privacy Perimeter**: The user always knows where compute executes. The app strictly distinguishes between `Local / On-device`, `Snapdragon NPU`, `Cloud`, and `Not configured`.
3. **Multi-Turn Adversarial Judge Simulation**: Simulates distinct evaluator personas (e.g., Skeptical Architect, Pragmatic Investor, Technical Product Judge) with adaptive follow-ups and rubric-based evaluations.
4. **Verbal Defense Drills with Local STT**: High-accuracy verbal practice with live cadence pacing, audio visualizer throttling, and zero raw audio persistence.
5. **Deterministic Grounded Fallbacks**: If no remote or local neural runtime is reachable, an embedded domain rules engine evaluates answers against indexed project evidence, ensuring uninterrupted rehearsal even in offline pitch venues.

---

## 3. Snapdragon & Qualcomm Alignment

Aegis Local is purpose-built to harness the hardware advantages of the **Qualcomm Snapdragon X Elite** platform:

- **45 TOPS Hexagon NPU Offload**: Heavy generative reasoning and embedding tasks are mapped to the Qualcomm Hexagon Tensor Processor (HTP) via the ONNX Runtime QNN Execution Provider.
- **Battery-Conscious Rehearsal**: NPU acceleration provides high-throughput inference with a fraction of the thermal and energy envelope of traditional discrete GPUs, enabling hours of unplugged rehearsal.
- **Honest Hardware Verification**: Aegis Local never fabricates NPU active states. Probing checks ARM64 Windows device architecture, Qualcomm AI Engine DLLs, and QNN runtime services before reporting hardware acceleration.

---

## 4. Privacy Model

- **Absolute Project Isolation**: Every artifact (document text, knowledge chunks, session histories, chat logs) is namespaced strictly by `projectId`.
- **Zero Third-Party Telemetry**: Zero Google Analytics, zero third-party CDNs, and zero hidden tracking scripts.
- **Safe Rendering**: All markdown is parsed into structured React nodes without `dangerouslySetInnerHTML`.
- **Total Project Purging**: Deleting a project permanently purges all associated data from the browser / local store.

---

## 5. Live Demo Walk-Through Script

### Step 1: Tour the Workspace & Demo Project
1. Launch Aegis Local. Notice the dark desktop aesthetic and the Topbar project selector.
2. If no project is active, click **"Open Aegis Journal Demo"**.
3. View the indexed files: architecture diagrams, security specifications, and pitch deck notes.

### Step 2: Explore Grounded Knowledge ("Ask Aegis")
1. Navigate to **Ask Aegis**.
2. Click a suggested prompt, such as: *"What problem does my project solve?"* or *"How does my architecture work?"*
3. Notice that the generated answer cites the specific project documents with verified source badges.

### Step 3: Run a Judge Simulation ("Judge Mode")
1. Navigate to **Judge Mode**.
2. Select the **Skeptical Technical Architect** persona.
3. Start the session. The judge generates a probing architectural question grounded in the staged project documents.
4. Submit a technical response. View the instant rubric assessment, identified strengths, and points for improvement.

### Step 4: Verbal Defense Practice ("Voice Practice")
1. Navigate to **Voice Practice**.
2. Select **"Elevator Pitch"** or **"Technical Defense"**.
3. Click **"Start Recording"** (or type manually). Deliver a 30-second verbal answer.
4. Stop and click **"Analyze Answer"**. The analysis evaluates speech cadence, clarity, and factual alignment with project files.

### Step 5: Audit Readiness & Storage Health ("Readiness" & "Settings")
1. Navigate to **Readiness**. View the comprehensive project readiness score across Architectural Depth, Defense Robustness, Delivery Clarity, and Grounding.
2. Navigate to **Settings > Storage Sandbox**. Inspect the **Storage Health & Quota Inspector** displaying itemized byte breakdowns and the one-click orphaned data cleaner.
3. Check **Settings > Snapdragon & Local Runtime** to inspect real-time hardware probing and the modular Qualcomm architecture.
