import {
  AIProvider,
  AIProviderCapabilities,
  AIModelConfig,
  AIProviderStatus,
  AIRequest,
  AIRequestContext,
  AIResponse,
  SourceReference,
} from '../../types/ai';
import { PreparationPlan } from '../../types/prepare';
import {
  JudgeConfig,
  JudgeQuestion,
  AnswerEvaluation,
  QuestionAttempt,
  JudgeSessionSummary,
  ReadinessEvidence,
} from '../../types/judge';
import { VoicePracticePrompt, VoicePracticeResult } from '../../types/voice';
import { CategoryAssessment, ReadinessPracticeRecommendation } from '../../types/readiness';

export class OfflineGroundedProvider implements AIProvider {
  id = 'offline-grounded-provider';
  name = 'Demo / Offline Grounded Mode';

  capabilities: AIProviderCapabilities = {
    textGeneration: true,
    streaming: false,
    embeddings: false,
    structuredJson: true,
    vision: false,
    speech: false,
    isLocal: true,
    isRemote: false,
    supportsStreaming: false,
    supportsGrounding: true,
    maxContextTokens: 16384,
  };

  modelConfig: AIModelConfig = {
    providerId: 'offline-grounded-provider',
    modelId: 'deterministic-grounded-engine',
    displayName: 'Deterministic Grounded Engine (Client Sandbox)',
    contextLength: 16384,
    capabilities: {
      textGeneration: true,
      streaming: false,
      embeddings: false,
      structuredJson: true,
      vision: false,
      speech: false,
      isLocal: true,
      isRemote: false,
    },
    executionTarget: 'browser',
    quantization: 'N/A (Deterministic Rule Engine)',
    recommendedHardware: 'Standard Web Browser (Universal Compatibility)',
    notes: 'Operates 100% offline in browser memory. Never fabricates neural AI claims; synthesizes responses from extracted project context.',
  };

  async isAvailable(): Promise<boolean> {
    return true; // Always available anywhere, including static GitHub Pages
  }

  async status(): Promise<AIProviderStatus> {
    return {
      id: this.id,
      name: this.name,
      available: true,
      configured: true,
      local: true,
      model: 'Deterministic Grounded Engine',
      executionTarget: 'browser',
      processingLocation: 'Local / On-device',
      hardwareTarget: 'Browser Sandbox (Client-Side Logic)',
      message:
        'Demo / Offline Grounded Mode is active. Responses are deterministically derived from project files without external runtimes or API keys.',
      capabilities: this.capabilities,
      lastChecked: Date.now(),
    };
  }

  /**
   * Ask Aegis Grounded Q&A
   */
  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    return this.answerQuestion(request) as Promise<AIResponse<T>>;
  }

  async answerQuestion(request: AIRequest): Promise<AIResponse> {
    const q = (request.question || request.prompt || '').trim();
    const ctx = (request.context || {}) as AIRequestContext;
    const projectName = request.projectName || 'Active Project';
    const sources: SourceReference[] = [];

    // Check if project has context
    const hasContext =
      ctx.overview ||
      (ctx.technologies && ctx.technologies.length > 0) ||
      (ctx.architecture && ctx.architecture.length > 0) ||
      (ctx.documentSnippets && ctx.documentSnippets.length > 0);

    if (!hasContext) {
      return {
        answer: `### [Offline Grounded Analysis]\n\n*Processing Mode: Offline Client-Side (No Neural LLM)*\n\nNo project documents or architectural facts have been indexed for **${projectName}** yet.\n\n**To enable grounded analysis in Offline Mode:**\n1. Go to **Project Setup**\n2. Add slide decks (\`.pptx\`), architecture briefs (\`.pdf\`/\`.docx\`), or notes (\`.md\`/\`.txt\`)\n3. Aegis Local will index your project context completely in your browser sandbox.`,
        sources: [],
        provider: this.name,
        providerId: this.id,
        processingMode: 'Local / On-device',
        executionTarget: 'browser',
        grounded: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Match keywords against context
    const qLower = q.toLowerCase();
    const matchedSections: string[] = [];

    if (ctx.overview && (qLower.includes('what') || qLower.includes('overview') || qLower.includes('about') || qLower.includes('project') || qLower.length < 15)) {
      matchedSections.push(`**Project Purpose & Overview:**\n${ctx.overview}`);
    }

    if (ctx.problem && (qLower.includes('problem') || qLower.includes('why') || qLower.includes('need') || qLower.includes('pain'))) {
      matchedSections.push(`**Core Problem Addressed:**\n${ctx.problem}`);
    }

    if (ctx.solution && (qLower.includes('solution') || qLower.includes('solve') || qLower.includes('how'))) {
      matchedSections.push(`**Proposed Solution:**\n${ctx.solution}`);
    }

    if (ctx.technologies && ctx.technologies.length > 0 && (qLower.includes('tech') || qLower.includes('stack') || qLower.includes('library') || qLower.includes('tool') || qLower.includes('built'))) {
      matchedSections.push(`**Key Technologies:**\n${ctx.technologies.map((t: string) => `• \`${t}\``).join('\n')}`);
    }

    if (ctx.architecture && ctx.architecture.length > 0 && (qLower.includes('arch') || qLower.includes('design') || qLower.includes('flow') || qLower.includes('data') || qLower.includes('system'))) {
      matchedSections.push(`**Architectural Structure:**\n${ctx.architecture.map((a: string) => `• ${a}`).join('\n')}`);
    }

    if (ctx.security && ctx.security.length > 0 && (qLower.includes('sec') || qLower.includes('priv') || qLower.includes('safe') || qLower.includes('encrypt') || qLower.includes('protect'))) {
      matchedSections.push(`**Security & Privacy Boundaries:**\n${ctx.security.map((s: string) => `• ${s}`).join('\n')}`);
    }

    // Check document snippets
    if (ctx.documentSnippets && Array.isArray(ctx.documentSnippets)) {
      const qTokens = qLower.split(/\W+/).filter((t: string) => t.length > 3);
      for (const snippet of ctx.documentSnippets) {
        const snippetLower = (snippet.text || '').toLowerCase();
        const matchesToken = qTokens.some((t: string) => snippetLower.includes(t));
        if (matchesToken || matchedSections.length === 0) {
          sources.push({
            fileName: snippet.fileName,
            snippet: (snippet.text || '').slice(0, 180) + '...',
          });
          if (matchedSections.length < 3) {
            matchedSections.push(`**From \`${snippet.fileName}\`:**\n> "${(snippet.text || '').slice(0, 240)}..."`);
          }
        }
      }
    }

    // Default summary if specific sections did not trigger
    if (matchedSections.length === 0) {
      if (ctx.overview) matchedSections.push(`**Project Overview:**\n${ctx.overview}`);
      if (ctx.technologies?.length) matchedSections.push(`**Detected Technologies:** ${ctx.technologies.join(', ')}`);
      if (ctx.architecture?.length) matchedSections.push(`**Architecture Concepts:** ${ctx.architecture.join(', ')}`);
    }

    if (ctx.sourceAttributions && Array.isArray(ctx.sourceAttributions) && sources.length === 0) {
      sources.push(...ctx.sourceAttributions.slice(0, 3));
    }

    const answer = `### [Offline Grounded Analysis]\n\n*Generated deterministically from active project context without neural LLM inference.*\n\n**Query:** "${q}"\n\n${matchedSections.join('\n\n')}\n\n---\n*Note: To run neural reasoning with live streaming generation, configure a Snapdragon NPU runtime, a local host model, or opt-in to Cloud Enclave in Settings.*`;

    return {
      answer,
      sources,
      provider: this.name,
      providerId: this.id,
      processingMode: 'Local / On-device',
      executionTarget: 'browser',
      grounded: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Prepare Me Plan Synthesis
   */
  async generatePreparationPlan(request: any): Promise<PreparationPlan> {
    const projectName = request.projectName || 'Project';
    const ctx = request.context || {};
    const techList = ctx.technologies?.length ? ctx.technologies.join(', ') : 'core local components';
    const archList = ctx.architecture?.length ? ctx.architecture.join(', ') : 'client-side pipeline';
    const problem = ctx.problem || 'uncontrolled cloud exposure';

    const plan: PreparationPlan = {
      id: `plan-offline-${Date.now()}`,
      projectId: request.projectId,
      createdAt: new Date().toISOString(),
      preferences: request.preferences || {
        goal: 'Competition',
        difficulty: 'Technical',
        focusAreas: ['Architecture', 'Trade-offs', 'Security'],
        sessionPreference: 'Standard',
      },
      projectSummary: {
        whatItIs: ctx.overview || `${projectName} is a private on-device presentation and defense preparation system.`,
        problemItSolves: ctx.problem || 'Eliminates cloud dependency and IP exposure when preparing technical project defenses.',
        howItWorks: ctx.solution || `Indexes local project material into structured knowledge without outbound network leaks.`,
        whyItMatters: `Ensures robust presentation readiness, empirical rubric evaluation, and zero IP exposure.`,
        sources: ctx.sourceAttributions || [],
      },
      pitch60s: {
        title: '60-Second Pitch',
        pitch: `This is ${projectName}. It solves ${problem} by implementing ${archList} with ${techList}. By evaluating technical defense claims locally on-device, presenters can test their readiness under realistic judge pressure without risking proprietary project IP.`,
        estimatedSeconds: 60,
      },
      presentationStory: [
        { title: '1. Opening & Hook', narrative: `Introduce ${projectName} and immediately state the core problem (${problem}).`, needsProjectEvidence: false },
        { title: '2. The Core Problem', narrative: `Explain why conventional solutions fall short when handling ${problem}.`, needsProjectEvidence: false },
        { title: '3. Architectural Solution', narrative: `Detail the system design built with ${techList} and ${archList}.`, needsProjectEvidence: false },
        { title: '4. Technical Defensibility', narrative: `Highlight trade-offs and verified project constraints grounded in local files.`, needsProjectEvidence: false },
        { title: '5. Impact & Conclusion', narrative: `Summarize the tangible outcome and key competition differentiator.`, needsProjectEvidence: false },
      ],
      keyPoints: [
        { topic: 'System Core Purpose', category: 'Solution', whyItMatters: 'Foundational understanding for technical evaluators.', supportingSource: 'Project Overview' },
        { topic: 'Architectural Decisions', category: 'Architecture', whyItMatters: `Justifies the selection of ${techList}.`, supportingSource: 'Technical Specification' },
        { topic: 'Local Privacy Boundaries', category: 'Security', whyItMatters: 'Guarantees that sensitive project assets remain strictly on-device.', supportingSource: 'Privacy Boundary' },
      ],
      technicalDefense: [
        {
          question: `Why did you select ${techList} instead of an established external cloud service?`,
          whyAsked: 'Judges test architectural intentionality and operational trade-off understanding.',
          projectEvidence: `Codebase utilizes ${techList} for deterministic local client-side execution.`,
          suggestedAnswerStructure: ['State privacy & offline availability motivation', 'Explain latency and cost advantages', 'Acknowledge local resource bounds'],
          sourceFiles: ['Project Overview'],
        },
      ],
      difficultQuestions: [
        {
          question: `What is the most vulnerable scaling bottleneck in your current architecture?`,
          area: 'Scalability & Performance',
          vulnerabilityOrRisk: 'Local browser memory or client-side storage limits under heavy file ingress.',
          defenseRecommendation: 'Acknowledge browser storage bounds and describe the designed paging/purging lifecycle.',
        },
      ],
      weakAreas: [
        {
          area: 'Runtime Resource Footprint',
          whyItMatters: 'Technical evaluators often challenge whether heavy models or parsers degrade host responsiveness.',
          missingEvidence: 'Explicit RAM and disk consumption telemetry across extended sessions.',
          recommendedPreparation: 'Rehearse memory bounds defense and highlight deterministic offline fallbacks.',
        },
      ],
      tradeoffs: [
        {
          decision: `On-Device Client-Side Execution (${techList})`,
          alternativeLabel: 'Centralized Cloud APIs',
          whyDecisionMade: 'Eliminates external telemetry, protects confidential project IP, and enables offline rehearsal.',
          potentialDownside: 'Restricted to local device compute and available client resources.',
          howToDefend: 'Demonstrate deterministic fallback pipelines and high-efficiency local index extraction.',
        },
      ],
      likelyQuestions: [
        {
          question: `How does ${projectName} verify that no sensitive project data is leaked during evaluation?`,
          category: 'Security',
          priority: 'High',
          sourceReferences: ['Privacy Architecture'],
        },
        {
          question: `How do you handle unexpected question topics that fall outside the indexed project documents?`,
          category: 'Technical',
          priority: 'Medium',
          sourceReferences: ['Grounded Index'],
        },
      ],
      checklist: [
        { id: 'chk-1', task: 'Slide deck verified and rendered in 16:9 aspect ratio', completed: false },
        { id: 'chk-2', task: 'Live demonstration script rehearsed with zero external internet dependencies', completed: false },
        { id: 'chk-3', task: 'Target timing verified within competition presentation limits', completed: false },
      ],
      recommendedPractice: [
        {
          action: 'Run a 5-question Skeptical Architect simulation',
          reason: 'Validates technical defense responses under adversarial cross-examination.',
          tag: 'Judge Simulation',
        },
        {
          action: 'Practice 60-second verbal pitch drill',
          reason: 'Verifies concise opening hook and speech cadence under 160 wpm.',
          tag: 'Voice Practice',
        },
      ],
      sourceAttributions: ctx.sourceAttributions || [],
      providerName: this.name,
    };

    return plan;
  }

  /**
   * Judge Simulation: Generate Question
   */
  async generateJudgeQuestion(request: any): Promise<JudgeQuestion> {
    const config: JudgeConfig = request.config || { persona: 'skeptical-architect', difficulty: 'challenging', focusAreas: [] };
    const ctx = request.context || {};
    const projectName = request.projectName || 'Project';
    const tech = ctx.technologies?.[0] || 'core local stack';
    const arch = ctx.architecture?.[0] || 'local processing engine';
    const attempts: QuestionAttempt[] = request.attempts || [];
    const count = attempts.length;

    const templates: Array<{ category: string; question: string; whyAsked: string }> = [
      {
        category: 'Architecture',
        question: `How does your architecture guarantee that user data stays strictly on-device when executing ${arch}?`,
        whyAsked: 'Judges test whether privacy claims are backed by enforceable structural code boundaries.',
      },
      {
        category: 'Trade-offs',
        question: `You opted for ${tech} over alternative frameworks. What specific performance or resource limitations did you accept in exchange?`,
        whyAsked: 'Judges verify whether the team has considered real-world operational trade-offs.',
      },
      {
        category: 'Security',
        question: `Walk me through your threat model. What prevents unauthorized extraction or memory tampering in ${projectName}?`,
        whyAsked: 'Assesses whether defensive guarantees are verifiable or merely theoretical marketing.',
      },
      {
        category: 'Problem & Solution',
        question: `Why do existing approaches fail to adequately solve this problem, and where does your implementation draw the line between client and host?`,
        whyAsked: 'Tests if the team can defend the core architectural value proposition under pressure.',
      },
      {
        category: 'Failure Modes',
        question: `What happens when the local system encounters malformed data or resource starvation during execution?`,
        whyAsked: 'Judges probe defensive error handling, failure recovery, and graceful degradation.',
      },
    ];

    const selected = templates[count % templates.length];
    return {
      id: `jq-offline-${Date.now()}-${count}`,
      category: selected.category,
      difficulty: config.difficulty,
      question: selected.question,
      whyAsked: selected.whyAsked,
      sourceReferences: (ctx.sources || []).map((s: any) => s.fileName || s).slice(0, 2),
    };
  }

  /**
   * Judge Simulation: Evaluate Answer
   */
  async evaluateJudgeAnswer(request: any): Promise<AnswerEvaluation> {
    const question: JudgeQuestion = request.question || { question: '' };
    const answer = (request.answer || '').trim();
    const ctx = request.context || {};
    const wordCount = answer.split(/\s+/).filter(Boolean).length;
    const mentionsTech = (ctx.technologies || []).some((t: string) =>
      answer.toLowerCase().includes(t.toLowerCase())
    );

    const strengths: string[] = [];
    const gaps: string[] = [];

    if (wordCount >= 25) {
      strengths.push('Provided a structured, multi-sentence technical defense.');
    } else {
      gaps.push('Response was brief; judges expect deeper rationale on implementation mechanisms.');
    }

    if (mentionsTech) {
      strengths.push('Directly anchored response to verified project technologies and constraints.');
    } else {
      gaps.push('Did not reference specific project components, trade-offs, or filenames.');
    }

    return {
      overallAssessment:
        wordCount >= 25
          ? '[Offline Grounded Analysis] Solid foundational defense addressing the question with sound engineering reasoning.'
          : '[Offline Grounded Analysis] Answer is concise but lacks critical technical depth and concrete mitigation details.',
      strengths: strengths.length > 0 ? strengths : ['Addressed the main question topic directly.'],
      gaps: gaps.length > 0 ? gaps : ['Could provide specific telemetry or constraint parameters.'],
      corrections: [],
      evidence: (ctx.sources || []).map((s: any) => `Referenced file: ${s.fileName || s}`).slice(0, 2),
      suggestedImprovement:
        'When presenting live, state the architectural constraint first, name the component responsible, and conclude with the trade-off.',
      nextDifficultyRecommendation: wordCount >= 30 ? 'challenging' : 'technical',
    };
  }

  /**
   * Judge Simulation: Summarize Session
   */
  async summarizeJudgeSession(request: any): Promise<{ summary: JudgeSessionSummary; readinessEvidence: ReadinessEvidence }> {
    const attempts: QuestionAttempt[] = request.attempts || [];
    const attemptedCount = attempts.filter((a) => !a.skipped && a.answer).length;
    const skippedCount = attempts.filter((a) => a.skipped).length;

    const allStrengths = attempts.flatMap((a) => a.evaluation?.strengths || []).slice(0, 3);
    const allGaps = attempts.flatMap((a) => a.evaluation?.gaps || []).slice(0, 3);

    return {
      summary: {
        questionsAttempted: attemptedCount,
        questionsSkipped: skippedCount,
        majorStrengths:
          allStrengths.length > 0
            ? allStrengths
            : ['Demonstrated clear understanding of project purpose and architecture.'],
        majorGaps:
          allGaps.length > 0
            ? allGaps
            : ['Deepen rehearsal on security edge cases and trade-off defense.'],
        topicsRequiringPractice: ['Failure recovery mechanics', 'Component boundary trade-offs'],
        recommendedNextStep: 'Review Weak Areas in Prepare Me and run an additional simulation.',
      },
      readinessEvidence: {
        projectUnderstanding: 'Demonstrated coherent understanding of project goals and structure.',
        problemSolutionClarity: 'Clearly articulated why the project exists and what problem it addresses.',
        technicalDefense: 'Stood up to technical questioning with substantive arguments.',
        architectureExplanation: 'Explained core components and data flow boundaries.',
        questionHandling: 'Engaged constructively with skeptical questions under timer constraints.',
        communicationClarity: 'Responses were concise, direct, and technically focused.',
        identifiedGaps: allGaps.length > 0 ? allGaps : ['More precision needed on benchmark claims.'],
      },
    };
  }

  /**
   * Voice Practice Analysis
   */
  async analyzeVoicePractice(request: any): Promise<VoicePracticeResult> {
    const prompt: VoicePracticePrompt = request.prompt || { mode: 'pitch-60', title: '60s Pitch', category: 'clarity' };
    const transcript = (request.transcript || '').trim();
    const durationSeconds = Number(request.durationSeconds) || 60;
    const ctx = request.context || {};
    const words = transcript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Words per minute (WPM)
    const minutes = Math.max(0.2, durationSeconds / 60);
    const wpm = Math.round(wordCount / minutes);

    // Pacing rating
    let clarityScore = 3.5;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wpm >= 110 && wpm <= 160) {
      clarityScore = 4.5;
      strengths.push(`Excellent speaking cadence (~${wpm} WPM is within the optimal 120–150 WPM presentation target).`);
    } else if (wpm < 110) {
      clarityScore = 3.0;
      improvements.push(`Pacing was slow (~${wpm} WPM). Practice delivering key points with more forward momentum.`);
    } else {
      clarityScore = 3.0;
      improvements.push(`Pacing was fast (~${wpm} WPM). Slow down at key architectural transitions to allow judges to absorb concepts.`);
    }

    // Terminology check
    const techMatches = (ctx.technologies || []).filter((t: string) =>
      transcript.toLowerCase().includes(t.toLowerCase())
    );

    let accuracyScore = 3.5;
    if (techMatches.length > 0) {
      accuracyScore = 4.5;
      strengths.push(`Accurately incorporated project technical terminology: ${techMatches.join(', ')}.`);
    } else {
      improvements.push('Incorporate specific technology names and component roles to strengthen technical credibility.');
    }

    const defenseScore = prompt.category === 'defense' ? 4.0 : 3.5;
    const overallRubricScore = Math.round(((clarityScore + accuracyScore + defenseScore) / 3) * 10) / 10;

    return {
      mode: prompt.mode,
      transcript,
      summary: `[Offline Grounded Analysis] Verbal delivery evaluated deterministically against project context (${wordCount} words, ${wpm} WPM).`,
      strengths,
      improvements,
      missingPoints: techMatches.length === 0 ? ['Mention specific component architectures and design trade-offs.'] : [],
      projectEvidence: techMatches.map((t: string) => `Used project technology: ${t}`),
      recommendedPractice: ['Rehearse with the 60-Second Elevator Pitch mode targeting ~130 WPM.'],
      accuracyScore,
      clarityScore,
      defenseScore,
      overallRubricScore,
      primaryCategory: (prompt.category as any) || 'clarity',
    };
  }

  /**
   * Readiness Report Narrative Synthesis
   */
  async synthesizeReadinessReport(request: any): Promise<{
    overallExplanation: string;
    strengths: string[];
    weaknesses: string[];
    recommendedPractice: ReadinessPracticeRecommendation[];
    nextBestAction: any;
  }> {
    const overallScore = request.overallScore || 0;
    const overallLevel = request.overallLevel || 'Not Evaluated';
    const categories: CategoryAssessment[] = request.categories || [];

    const strongest = [...categories].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const weakest = [...categories].sort((a, b) => (a.score || 0) - (b.score || 0))[0];

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (strongest && strongest.score > 0) {
      strengths.push(`Strong evidence in ${strongest.name} (${strongest.score}/5): ${strongest.explanation || 'Solid preparation demonstrated.'}`);
    }
    if (weakest && weakest.score < 4) {
      weaknesses.push(`Improvement needed in ${weakest.name} (${weakest.score}/5): ${weakest.explanation || 'Requires additional practice sessions.'}`);
    }

    return {
      overallExplanation: `[Offline Grounded Analysis] Readiness evaluation calculated deterministically from verified defense sessions and voice practice attempts. Overall score: ${overallScore}/5 (${overallLevel}).`,
      strengths: strengths.length ? strengths : ['Project context is initialized.'],
      weaknesses: weaknesses.length ? weaknesses : ['Continue conducting simulated sessions to build rubric confidence.'],
      recommendedPractice: [
        {
          id: 'rec-1',
          area: weakest?.name || 'Technical Defense',
          whyItMatters: 'Judges focus probing questions on areas with sparse technical justification.',
          whatToPractice: 'Focus your next practice round on questions in your lowest-scoring category.',
          priority: 'high',
          relatedCategory: weakest?.id || 'technicalDefense',
        },
      ],
      nextBestAction: {
        title: `Practice ${weakest?.name || 'Technical Q&A'}`,
        explanation: `Run a 10-minute simulation to improve ${weakest?.name || 'defense readiness'}.`,
        actionCategory: weakest?.name || 'Defense',
        targetRoute: 'judge-mode',
      },
    };
  }
}

export const offlineGroundedProvider = new OfflineGroundedProvider();
