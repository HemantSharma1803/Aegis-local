import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google Gen AI client initialization
let genAiClient: GoogleGenAI | null = null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey });
  }
  return genAiClient;
}

// 1. AI Provider Status Endpoint
app.get('/api/ai/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    available: hasKey,
    provider: 'Google Gemini (Server-Side Enclave)',
    mode: hasKey ? 'remote' : 'unconfigured',
    model: GEMINI_MODEL,
    architecture: {
      snapdragonReady: true,
      targetDevice: 'Qualcomm Snapdragon X Elite / Plus (Windows on ARM64)',
      localExecutionTargets: ['browser', 'local-runtime', 'Snapdragon-NPU', 'cloud'],
      supportedEngines: ['QNN (Qualcomm Neural Network SDK)', 'ONNX Runtime', 'Google Gemini Enclave', 'Llama.cpp Host'],
    },
  });
});


// Helper: build system instruction with strict grounding rules
function buildSystemInstruction(context: any): string {
  return `You are Aegis Local, a competition-grade, project-grounded AI engineering coach and presentation defense assistant.
You are assisting a developer in understanding, presenting, and defending their technical project.

GROUNDING RULES (STRICT AND NON-NEGOTIABLE):
1. Answer questions using the provided PROJECT CONTEXT and RELEVANT DOCUMENT EXCERPTS.
2. NEVER fabricate, hallucinate, or invent project facts, technologies, benchmarks, or dependencies.
3. If the user asks about a specific technology, database, framework, feature, or metric (e.g., "What database does my project use?", "What is the battery consumption?"), and the project context DOES NOT contain evidence of it, you MUST explicitly state:
   "I couldn't find evidence of [topic/technology] in the available project material."
   Do NOT guess or substitute a "likely" technology.
4. If the user asks a general conceptual question (e.g. "What is PBKDF2?" or "How does AES-GCM work in general?"), provide a clear, rigorous technical explanation, but explicitly state that this is a "General technical explanation" and distinguish it from their specific project implementation.
5. Base your answers strictly on the user's project files. Always maintain source traceability.
6. Speak in a confident, professional, and precise tone appropriate for senior engineers and competition judges.
7. Use Markdown with clean formatting, bullet points, and code blocks where helpful.

PROJECT CONTEXT PROVIDED BY USER'S PROJECT ENGINE:
${context.systemContextPrompt || 'No extracted project text available.'}
`;
}

// 2. Standard Non-Streaming Ask Endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY.',
        available: false,
      });
    }

    const { question, context, conversationHistory } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const systemInstruction = buildSystemInstruction(context || {});

    // Convert conversation history into contents array for Gemini
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high factual adherence to project material
      },
    });

    const answerText = response.text || 'No response generated.';

    // Match which actual project sources were referenced or present
    const sources = (context && context.sourceAttributions) || [];
    const isGeneral =
      answerText.toLowerCase().includes('general technical explanation') ||
      answerText.toLowerCase().includes('general explanation');

    return res.json({
      answer: answerText,
      sources,
      provider: 'Google Gemini (Server-Side Enclave)',
      grounded: true,
      isGeneralKnowledge: isGeneral,
    });
  } catch (err: any) {
    console.error('[API /api/ai/ask] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error processing AI request.',
    });
  }
});

// 3. Streaming Ask Endpoint (Server-Sent Events)
app.post('/api/ai/stream', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY.',
        available: false,
      });
    }

    const { question, context, conversationHistory } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemInstruction = buildSystemInstruction(context || {});

    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      }
    }

    const sources = (context && context.sourceAttributions) || [];
    const isGeneral =
      fullText.toLowerCase().includes('general technical explanation') ||
      fullText.toLowerCase().includes('general explanation');

    res.write(
      `data: ${JSON.stringify({
        meta: {
          answer: fullText,
          sources,
          provider: 'Google Gemini (Server-Side Enclave)',
          grounded: true,
          isGeneralKnowledge: isGeneral,
        },
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[API /api/ai/stream] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Stream generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// 4. Structured Preparation Plan Generation Endpoint
app.post('/api/ai/prepare', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY.',
        available: false,
      });
    }

    const { projectId, projectName, preferences, context } = req.body;
    if (!projectId || !context) {
      return res.status(400).json({ error: 'Missing projectId or context.' });
    }

    const systemInstruction = `You are Aegis Local, a competition-grade, project-grounded AI engineering coach and presentation defense director.
Your mission is to transform the user's ACTUAL technical project context into a personalized presentation defense and preparation plan.

STRICT GROUNDING DIRECTIVES (NON-NEGOTIABLE):
1. Use the provided PROJECT CONTEXT and EXTRACTED PROJECT MATERIAL as the primary source of truth.
2. NEVER fabricate, hallucinate, or invent project facts, technologies, benchmarks, or dependencies.
3. Do NOT assume unmentioned technologies (e.g., do not say "PostgreSQL" if only SQLite or localStorage is mentioned, and do not invent Redis/Docker if not in the files).
4. Do NOT assume unmentioned performance numbers, metrics, or security claims.
5. Distinguish clearly:
   - FACT: Directly evidenced in project files.
   - INFERENCE: Architectural deduction based on visible code/specs.
   - RECOMMENDATION: Actionable advice for defending or presenting the project.
6. If evidence for any section (e.g. limitations, trade-offs, architecture) is incomplete or absent in project files, EXPLICITLY state:
   "Project material does not clearly establish [topic]." or set needsProjectEvidence to true.
7. The goal is RIGOROUS PREPARATION and DEFENSE against skeptical technical judges/interviewers, NOT generic praise or flattering marketing hype.
8. Output MUST strictly be valid JSON matching the requested schema.

PROJECT CONTEXT PROVIDED:
${context.systemContextPrompt || 'No extracted project text available.'}

PREPARATION PREFERENCES:
- Target Goal: ${preferences?.goal || 'Competition'}
- Difficulty Level: ${preferences?.difficulty || 'Technical'}
- Focus Areas: ${(preferences?.focusAreas || []).join(', ') || 'All areas'}
- Session Depth: ${preferences?.sessionPreference || 'Standard'}
`;

    const promptText = `Analyze the provided project material and generate a complete, rigorous presentation defense and preparation plan.

Return your analysis strictly as a single JSON object with this exact structure:
{
  "projectSummary": {
    "whatItIs": "Concise factual definition grounded in files",
    "problemItSolves": "Specific problem addressed by the project",
    "howItWorks": "Factual workflow/mechanism",
    "whyItMatters": "Significance and architectural impact"
  },
  "pitch60s": {
    "title": "60-Second Pitch",
    "pitch": "Natural, spoken-language friendly, technically credible 60-second pitch the user can speak directly to judges without generic marketing buzzwords.",
    "estimatedSeconds": 60
  },
  "presentationStory": [
    {
      "title": "1. Opening",
      "narrative": "Crisp opening hook introducing the system",
      "needsProjectEvidence": false
    },
    {
      "title": "2. Problem",
      "narrative": "Factual problem context based on project files",
      "needsProjectEvidence": false
    },
    {
      "title": "3. Solution",
      "narrative": "How the solution addresses the problem directly",
      "needsProjectEvidence": false
    },
    {
      "title": "4. Architecture & Technical Decisions",
      "narrative": "Concrete architectural structure visible in project",
      "needsProjectEvidence": false
    },
    {
      "title": "5. Limitations & Trade-offs",
      "narrative": "Honest technical trade-offs or constraints",
      "needsProjectEvidence": false
    },
    {
      "title": "6. Closing",
      "narrative": "Strong, concise concluding statement",
      "needsProjectEvidence": false
    }
  ],
  "keyPoints": [
    {
      "topic": "Key technical talking point",
      "category": "Problem" | "Solution" | "Architecture" | "Technology" | "Security" | "Innovation" | "Trade-offs",
      "whyItMatters": "Why judges/reviewers care",
      "supportingSource": "Filename or component reference from project"
    }
  ],
  "technicalDefense": [
    {
      "question": "Pungent technical question a skeptical judge would ask about an architectural decision",
      "whyAsked": "Underlying concern (e.g. latency, concurrency, fault-tolerance)",
      "projectEvidence": "What the codebase / docs actually specify",
      "suggestedAnswerStructure": [
        "Acknowledge the design parameter",
        "Explain the specific constraint driving the choice",
        "Highlight the mitigation in place"
      ],
      "sourceFiles": ["file1.md"]
    }
  ],
  "difficultQuestions": [
    {
      "question": "Tough question that exposes potential edge cases or weaknesses",
      "area": "Security / Scalability / Concurrency / Architecture",
      "vulnerabilityOrRisk": "What could break or where evidence is thin",
      "defenseRecommendation": "How the developer should honestly address it",
      "sourceFiles": ["file1.md"]
    }
  ],
  "weakAreas": [
    {
      "area": "Specific subsystem or topic",
      "whyItMatters": "Why this gap exposes the presenter to scrutiny",
      "missingEvidence": "Project material does not clearly explain...",
      "recommendedPreparation": "Concrete step the developer should take before the presentation"
    }
  ],
  "tradeoffs": [
    {
      "decision": "Architectural or technology decision visible in project",
      "alternativeLabel": "Possible alternative (labeled as possible)",
      "whyDecisionMade": "Why this path was chosen based on visible context",
      "potentialDownside": "Inherent drawback of this approach",
      "howToDefend": "Defensible engineering rationale"
    }
  ],
  "likelyQuestions": [
    {
      "question": "Anticipated judge or reviewer question",
      "category": "Foundational" | "Technical" | "Architecture" | "Security" | "AI/ML" | "Product" | "Challenge-level",
      "priority": "High" | "Medium" | "Low",
      "sourceReferences": ["file1.md"]
    }
  ],
  "checklist": [
    {
      "id": "chk-1",
      "task": "Explain the core problem clearly in under 30 seconds",
      "completed": false
    },
    {
      "id": "chk-2",
      "task": "Defend the primary architectural trade-off",
      "completed": false
    }
  ],
  "recommendedPractice": [
    {
      "action": "Specific practice exercise",
      "reason": "Why this addresses a key vulnerability",
      "tag": "Spoken Practice / Technical Drill"
    }
  ]
}

DO NOT wrap in markdown markdown backticks if possible, return raw JSON string. Ensure every single category in keyPoints and likelyQuestions matches the schema exactly.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean possible backticks
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Attach real source attributions from context
    const sourceAttributions = (context && context.sourceAttributions) || [];

    // Ensure all checklist items have unique IDs
    const checklist = Array.isArray(parsed.checklist)
      ? parsed.checklist.map((item: any, i: number) => ({
          id: item.id || `chk-${i + 1}`,
          task: item.task || String(item),
          completed: Boolean(item.completed),
        }))
      : [];

    const plan = {
      id: `plan-${Date.now()}`,
      projectId,
      createdAt: new Date().toISOString(),
      preferences,
      projectSummary: {
        ...parsed.projectSummary,
        sources: sourceAttributions,
      },
      pitch60s: parsed.pitch60s || {
        title: '60-Second Pitch',
        pitch: 'Pitch could not be synthesized.',
        estimatedSeconds: 60,
      },
      presentationStory: parsed.presentationStory || [],
      keyPoints: parsed.keyPoints || [],
      technicalDefense: parsed.technicalDefense || [],
      difficultQuestions: parsed.difficultQuestions || [],
      weakAreas: parsed.weakAreas || [],
      tradeoffs: parsed.tradeoffs || [],
      likelyQuestions: parsed.likelyQuestions || [],
      checklist,
      recommendedPractice: parsed.recommendedPractice || [],
      sourceAttributions,
      providerName: 'Google Gemini (Server-Side Enclave)',
    };

    return res.json(plan);
  } catch (err: any) {
    console.error('[API /api/ai/prepare] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error generating preparation plan.',
    });
  }
});

// 5. Judge Mode - Generate Question Endpoint (Adaptive & Project-Grounded)
app.post('/api/ai/judge/question', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY in Settings.',
        available: false,
      });
    }

    const { projectId, projectName, config, previousAttempts, context } = req.body;
    if (!projectId || !context) {
      return res.status(400).json({ error: 'Missing projectId or context.' });
    }

    const previousAttemptsSummary = (previousAttempts || [])
      .map((att: any, idx: number) => {
        if (att.skipped) {
          return `Attempt ${idx + 1}: [SKIPPED] Question: "${att.question}"`;
        }
        return `Attempt ${idx + 1}: Question: "${att.question}" | User Answer: "${att.answer || 'No answer'}" | Evaluation: "${att.overallAssessment || 'N/A'}" | Identified Gaps: ${(att.gaps || []).join(', ') || 'None'}`;
      })
      .join('\n');

    const systemInstruction = `You are a distinguished technical judge and reviewer on a competition grand jury panel (Aegis Local Judge Mode).
Your task is to conduct an adaptive, rigorous, yet strictly fair and professional technical presentation defense of the project "${projectName}".

JUDGE PERSONA DIRECTIVES:
1. Professional, skeptical, fair, technically rigorous, and concise.
2. The purpose is to stress-test the project's technical decisions, architecture, edge cases, and trade-offs.
3. NEVER insult, humiliate, or show hostility to the presenter. Critique the technical reasoning and project decisions, not the person.
4. STRICT GROUNDING: Ground questions directly in the provided PROJECT CONTEXT and EXTRACTED PROJECT MATERIAL.
   - NEVER fabricate technologies, metrics, benchmarks, or unmentioned libraries.
   - If the project uses SQLite or localStorage, do NOT assume PostgreSQL or Redis.
   - If the project has missing documentation or unclear trade-offs, that is an ideal attack vector.
5. ONE QUESTION AT A TIME: Ask exactly ONE short, clear, specific, technically relevant question (1-3 sentences max).
6. ADAPTIVE LOGIC:
   - If this is Question 1: Ask an incisive opening question matching the configured focus (${config?.focus || 'mixed'}) and difficulty (${config?.difficulty || 'technical'}).
   - If previous answer was strong: follow up with a deeper technical drill, architectural constraint, or challenging failure mode.
   - If previous answer was incomplete or vague: ask a direct cross-examination question probing the specific missing detail or gap.
   - If previous answer showed weak understanding: ask a foundational question testing the core design assumptions.
   - If previous question was skipped: pivot cleanly to another relevant topic area without being dismissive.
   - If question style is "cross-examination": formulate an adversarial follow-up challenging the user's previous claim or design assumption.
7. Output MUST strictly be valid JSON matching the schema.

PROJECT CONTEXT:
${context.systemContextPrompt || 'No context available.'}

${context.preparationInsights ? `PREPARATION AUDIT INSIGHTS:\n- Weak Areas: ${context.preparationInsights.weakAreas.join('; ')}\n- Trade-offs: ${context.preparationInsights.tradeoffs.join('; ')}\n` : ''}

SESSION CONFIGURATION:
- Difficulty Target: ${config?.difficulty || 'technical'}
- Line of Focus: ${config?.focus || 'mixed'}
- Question Style: ${config?.questionStyle || 'direct'}

PREVIOUS ATTEMPTS IN THIS SESSION:
${previousAttemptsSummary || 'None (First Question)'}
`;

    const promptText = `Generate the next judge question for the defense simulation.

Respond strictly with a single JSON object in this format:
{
  "id": "jq-${Date.now()}",
  "category": "Architecture / Security / Technology / Problem & Solution / Trade-offs / Failure Modes",
  "difficulty": "easy" | "technical" | "challenging",
  "question": "The single concise, incisive question to ask the user",
  "whyAsked": "Short explanation of the engineering concern or judge rationale behind this question",
  "sourceReferences": ["file1.md"]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const judgeQuestion = {
      id: parsed.id || `jq-${Date.now()}`,
      category: parsed.category || 'Architecture',
      difficulty: parsed.difficulty || config?.difficulty || 'technical',
      question: parsed.question || 'Explain the core architectural decisions behind this project.',
      whyAsked: parsed.whyAsked || 'To evaluate technical understanding and justification of project design.',
      sourceReferences: Array.isArray(parsed.sourceReferences) ? parsed.sourceReferences : context.sourceFiles?.slice(0, 2) || [],
    };

    return res.json(judgeQuestion);
  } catch (err: any) {
    console.error('[API /api/ai/judge/question] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error generating judge question.',
    });
  }
});

// 6. Judge Mode - Evaluate Answer Endpoint
app.post('/api/ai/judge/evaluate', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY.',
        available: false,
      });
    }

    const { projectId, question, answer, config, context } = req.body;
    if (!projectId || !question || !answer) {
      return res.status(400).json({ error: 'Missing question or answer.' });
    }

    const systemInstruction = `You are an expert technical evaluator on a competition grand jury.
Your task is to evaluate the user's spoken or written defense answer to a specific technical question about the project.

EVALUATION DIRECTIVES:
1. Rigorous, objective, and fair technical analysis.
2. GROUNDING & EPISTEMIC HONESTY:
   - Distinguish PROJECT FACT (evidenced in project material) vs USER CLAIM vs JUDGE INFERENCE vs GENERAL GUIDANCE.
   - If the user makes claims unsupported by project files, DO NOT assume they are automatically lying, but note:
     "The available project material does not establish [claim]."
   - If the user contradicts project files, cite the specific contradiction in corrections.
3. NO FABRICATED NUMERICAL SCORES. Provide qualitative assessment and structured evidence.
4. Keep the evaluation crisp and actionable so the simulation remains fast and interactive.
5. Provide a next difficulty recommendation ('easy', 'technical', or 'challenging') based on the answer's depth.

PROJECT CONTEXT:
${context.systemContextPrompt || 'No project text available.'}

QUESTION ASKED:
- Category: ${question.category}
- Difficulty: ${question.difficulty}
- Question: "${question.question}"
- Why Asked: "${question.whyAsked}"

USER'S DEFENSE ANSWER:
"${answer}"
`;

    const promptText = `Evaluate the user's answer against the actual project context.

Return your evaluation strictly as a single JSON object in this format:
{
  "overallAssessment": "1-2 sentence qualitative verdict on the depth and accuracy of this response.",
  "strengths": [
    "Concrete technical point or evidence the user articulated well"
  ],
  "gaps": [
    "Specific nuance, trade-off, or architectural mitigation the user omitted"
  ],
  "corrections": [
    "Any factual discrepancies against project files, or state 'None' if accurate"
  ],
  "evidence": [
    "Relevant facts or specifications from project files relevant to this question"
  ],
  "suggestedImprovement": "Concrete, spoken-friendly advice on how to phrase or defend this under judge scrutiny.",
  "nextDifficultyRecommendation": "easy" | "technical" | "challenging"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const evaluation = {
      overallAssessment: parsed.overallAssessment || 'Defense recorded. Adequate high-level explanation provided.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Answer addressed the core prompt.'],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections.filter((c: string) => c.toLowerCase() !== 'none') : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      suggestedImprovement: parsed.suggestedImprovement || 'Be specific regarding constraints and mitigation strategies.',
      nextDifficultyRecommendation: parsed.nextDifficultyRecommendation || config?.difficulty || 'technical',
    };

    return res.json(evaluation);
  } catch (err: any) {
    console.error('[API /api/ai/judge/evaluate] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error evaluating answer.',
    });
  }
});

// 7. Judge Mode - Summarize Session & Extract Readiness Evidence
app.post('/api/ai/judge/summarize', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured.',
        available: false,
      });
    }

    const { projectId, projectName, config, attempts, context } = req.body;
    if (!projectId || !attempts) {
      return res.status(400).json({ error: 'Missing projectId or attempts.' });
    }

    const attemptsDetails = attempts
      .map((att: any, i: number) => {
        if (att.skipped) {
          return `Question ${i + 1} (${att.category} - ${att.difficulty}): "${att.question}" [SKIPPED BY USER]`;
        }
        return `Question ${i + 1} (${att.category} - ${att.difficulty}): "${att.question}"
User Answer: "${att.answer}"
Judge Assessment: "${att.evaluation?.overallAssessment || 'None'}"
Strengths: ${(att.evaluation?.strengths || []).join('; ')}
Gaps: ${(att.evaluation?.gaps || []).join('; ')}`;
      })
      .join('\n\n');

    const systemInstruction = `You are the lead director of the Technical Evaluation Committee.
The user has completed a Judge Mode presentation defense simulation for project "${projectName}".
Synthesize the session attempts into a comprehensive, factual summary and extract structured Readiness Evidence for the project's Readiness Report.

STRICT INSTRUCTIONS:
- Base all findings on the user's ACTUAL responses and observed performance during this session.
- NO FAKE READINESS SCORES OR ARBITRARY PERCENTAGES.
- Identify major demonstrated strengths, genuine gaps exposed under questioning, topics requiring drill, and a concrete next step.
- Output MUST strictly be valid JSON matching the requested schema.

PROJECT CONTEXT:
${context.systemContextPrompt || 'No project text available.'}

SESSION ATTEMPTS:
${attemptsDetails}
`;

    const promptText = `Synthesize the session and generate the summary and readiness evidence.

Respond strictly as a single JSON object in this format:
{
  "summary": {
    "questionsAttempted": number,
    "questionsSkipped": number,
    "majorStrengths": [
      "Key technical strength demonstrated"
    ],
    "majorGaps": [
      "Key vulnerability or gap exposed"
    ],
    "topicsRequiringPractice": [
      "Specific topic to drill before live judging"
    ],
    "recommendedNextStep": "Clear, actionable recommendation"
  },
  "readinessEvidence": {
    "projectUnderstanding": "Qualitative assessment of project understanding",
    "problemSolutionClarity": "Qualitative assessment of problem & solution clarity",
    "technicalDefense": "Qualitative assessment of technical trade-off and architectural defense",
    "architectureExplanation": "Qualitative assessment of architectural knowledge",
    "questionHandling": "Qualitative assessment of how the user handled skeptical questions",
    "communicationClarity": "Qualitative assessment of brevity and clarity",
    "identifiedGaps": [
      "Specific gap identified in project defense"
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const attemptedCount = attempts.filter((a: any) => !a.skipped && a.answer).length;
    const skippedCount = attempts.filter((a: any) => a.skipped).length;

    const result = {
      summary: {
        questionsAttempted: attemptedCount,
        questionsSkipped: skippedCount,
        majorStrengths: Array.isArray(parsed?.summary?.majorStrengths) ? parsed.summary.majorStrengths : ['Demonstrated project overview understanding.'],
        majorGaps: Array.isArray(parsed?.summary?.majorGaps) ? parsed.summary.majorGaps : [],
        topicsRequiringPractice: Array.isArray(parsed?.summary?.topicsRequiringPractice) ? parsed.summary.topicsRequiringPractice : ['Technical trade-off defenses'],
        recommendedNextStep: parsed?.summary?.recommendedNextStep || 'Review weak areas in Prepare Me and run another Technical drill.',
      },
      readinessEvidence: {
        projectUnderstanding: parsed?.readinessEvidence?.projectUnderstanding || 'Basic understanding demonstrated in defense simulation.',
        problemSolutionClarity: parsed?.readinessEvidence?.problemSolutionClarity || 'Problem and solution articulated.',
        technicalDefense: parsed?.readinessEvidence?.technicalDefense || 'Addressed primary technical questions.',
        architectureExplanation: parsed?.readinessEvidence?.architectureExplanation || 'Explained core architecture visible in project context.',
        questionHandling: parsed?.readinessEvidence?.questionHandling || 'Responded to judge inquiries under simulation constraints.',
        communicationClarity: parsed?.readinessEvidence?.communicationClarity || 'Communicated technical details clearly.',
        identifiedGaps: Array.isArray(parsed?.readinessEvidence?.identifiedGaps) ? parsed.readinessEvidence.identifiedGaps : [],
      },
    };

    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/ai/judge/summarize] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error summarizing judge session.',
    });
  }
});

// 8. Presentation Readiness Report - AI Synthesis Endpoint
app.post('/api/ai/readiness/report', async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'AI provider not configured. Please configure your GEMINI_API_KEY in Settings.',
        available: false,
      });
    }

    const {
      projectId,
      projectName,
      categories,
      overallLevel,
      overallScore,
      evidenceItems,
      sessionsSummary,
      context,
    } = req.body;

    if (!projectId || !categories) {
      return res.status(400).json({ error: 'Missing projectId or categories.' });
    }

    const categoriesEvidenceText = (categories || [])
      .map((c: any) => {
        return `Category: ${c.name} (${c.id})
- Evaluated Level: ${c.level} (Score: ${c.score}/5 on defined rubric)
- Evidence Points: ${c.evidenceCount} verified probe(s)
- Demonstrated Strengths: ${(c.strengths || []).join('; ') || 'None observed yet'}
- Exposed Gaps/Omissions: ${(c.gaps || []).join('; ') || 'None observed yet'}`;
      })
      .join('\n\n');

    const evidenceSnippets = (evidenceItems || [])
      .slice(0, 10)
      .map((ev: any, idx: number) => {
        return `[Evidence ${idx + 1}] Source: ${ev.sourceDate} (${ev.sourceType}) | Category: ${ev.category}
Question: "${ev.questionText || 'N/A'}"
User Answer: "${ev.answerSnippet || 'N/A'}"
Judge Assessment: "${ev.evaluationSnippet || 'N/A'}"
Verdict: ${ev.strengthOrGap}`;
      })
      .join('\n\n');

    const systemInstruction = `You are the chief evaluator synthesizing a Presentation Readiness Report for project "${projectName}".

CRITICAL EVALUATION MANDATES:
1. You are analyzing evidence from actual presentation practice sessions.
2. DO NOT INVENT EVIDENCE.
3. DO NOT ASSUME the user understands something unless the evidence supports it.
4. Distinguish observed evidence from inference.
5. Identify strengths fairly based on actual answers.
6. Identify gaps constructively based on actual judge evaluation feedback.
7. Recommend concrete, actionable practice.
8. DO NOT make personal judgments or use patronizing language.
9. DO NOT invent arbitrary or fake scores. Respect the rubric scores provided.
10. If evidence for a category is thin or not evaluated, state that clearly without guessing.

PROJECT CONTEXT:
${context?.systemContextPrompt || 'No additional project context provided.'}

PRACTICE SESSIONS OVERVIEW:
${sessionsSummary || 'Sessions recorded in project ledger.'}

ASSESSED CATEGORIES & EVIDENCE:
${categoriesEvidenceText}

PRIMARY EVIDENCE LOGS:
${evidenceSnippets}
`;

    const promptText = `Analyze the collected evidence and synthesize a cohesive Readiness Report.
Overall Status: ${overallLevel} (${overallScore}/5)

Return strictly valid JSON matching this schema:
{
  "overallExplanation": "A factual 2-3 sentence explanation of why the user earned this readiness status based strictly on the evaluated evidence.",
  "categoryNarratives": {
    "understanding": {
      "explanation": "Concise factual statement of project understanding demonstrated in practice.",
      "recommendation": "Concrete practice recommendation."
    },
    "clarity": {
      "explanation": "Concise factual statement of problem/solution clarity demonstrated.",
      "recommendation": "Concrete practice recommendation."
    },
    "defense": {
      "explanation": "Concise factual statement of technical defense & trade-off reasoning demonstrated.",
      "recommendation": "Concrete practice recommendation."
    },
    "architecture": {
      "explanation": "Concise factual statement of architecture explanation demonstrated.",
      "recommendation": "Concrete practice recommendation."
    },
    "questions": {
      "explanation": "Concise factual statement of question handling poise and responsiveness.",
      "recommendation": "Concrete practice recommendation."
    }
  },
  "strengths": [
    "Key verified strength demonstrated during simulations"
  ],
  "weaknesses": [
    "Key area to strengthen based on observed gaps under questioning"
  ],
  "recommendedPractice": [
    {
      "area": "Name of the area to drill",
      "whyItMatters": "Why this matters to presentation judges",
      "whatToPractice": "Specific exercise or drill to practice",
      "priority": "high" | "medium" | "low",
      "relatedCategory": "understanding" | "clarity" | "defense" | "architecture" | "questions"
    }
  ],
  "nextBestAction": {
    "title": "Single most impactful next step (e.g., 'Rehearse Architecture Defense')",
    "explanation": "Why this is the highest priority based on the largest identified gap.",
    "actionCategory": "architecture" | "defense" | "clarity" | "understanding" | "questions",
    "targetRoute": "judge-mode" | "prepare-me"
  }
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('[API /api/ai/readiness/report] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error synthesizing readiness report.',
    });
  }
});

// 12. Voice Practice Verbal Response Analysis Endpoint
app.post('/api/ai/voice-practice/analyze', async (req, res) => {
  const { projectId, projectName, prompt, transcript, durationSeconds, context } = req.body;

  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return res.status(400).json({ error: 'Missing or empty transcript to analyze.' });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.status(503).json({
      error: 'AI Provider is not configured or GEMINI_API_KEY is unset.',
      offlineFallbackRecommended: true,
    });
  }

  try {
    const systemInstruction = `You are Aegis Local, a competition-grade presentation defense coach and technical project evaluator.
You are evaluating a candidate's verbal presentation practice transcript against their real project context.

STRICT GROUNDING DIRECTIVES (CRITICAL):
1. You must ONLY validate claims that are verified by the PROJECT CONTEXT provided below.
2. NEVER invent technologies, performance numbers, security claims, benchmark results, or project features.
3. If the candidate makes claims about technologies or features NOT supported by the project context, flag them under improvements or missing points as "Unsupported claim not verified in project files".
4. Do NOT treat unsupported claims as facts.
5. Base your analysis on:
   - Accuracy regarding the actual project
   - Technical depth and understanding
   - Structural clarity and pacing
   - Completeness in addressing the prompt
   - Evidence cited from the project
   - Important omissions or missing points

PROJECT CONTEXT:
${context?.systemContextPrompt || `Project Name: ${projectName || 'Unknown'}`}`;

    const promptText = `Evaluate this verbal practice transcript:

PRACTICE MODE: ${prompt?.mode || 'voice-practice'}
PROMPT TITLE: ${prompt?.title || 'Practice Prompt'}
PROMPT QUESTION/TASK: ${prompt?.promptText || ''}
DURATION: ${durationSeconds || 0} seconds
MAX DURATION ALLOWED: ${prompt?.maxDurationSeconds || 180} seconds

CANDIDATE'S SPOKEN TRANSCRIPT:
"""
${transcript}
"""

Return a strictly valid JSON object matching this schema:
{
  "summary": "2-3 sentence executive evaluation of the verbal delivery and its alignment with actual project context.",
  "strengths": ["Specific strength 1 grounded in transcript", "Specific strength 2..."],
  "improvements": ["Specific improvement 1", "Specific improvement 2..."],
  "missingPoints": ["Important project fact or requirement that was omitted or unaddressed"],
  "projectEvidence": ["Fact or component from project context that was appropriately referenced or tested"],
  "recommendedPractice": ["Specific drill or re-attempt focus for the next session"],
  "accuracyScore": 4.0,
  "clarityScore": 4.5,
  "defenseScore": 4.0,
  "overallRubricScore": 4.2,
  "primaryCategory": "understanding" | "clarity" | "defense" | "architecture" | "questions"
}

Ensure all score fields are numbers between 1.0 and 5.0 (step 0.1).
Do not wrap in markdown quotes if possible, output pure JSON.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('[API /api/ai/voice-practice/analyze] Error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error evaluating voice practice transcript.',
      offlineFallbackRecommended: true,
    });
  }
});

// Vite Middleware for development / static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aegis Local] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
