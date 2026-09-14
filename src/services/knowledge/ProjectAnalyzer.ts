import { ExtractedDocument, ProjectKnowledge, KnowledgeItem } from '../../types/knowledge';

/**
 * Known tech & framework dictionaries for deterministic heuristic detection.
 * We only detect when explicitly present in the document text to strictly follow the truthfulness rule.
 */
const KNOWN_LANGUAGES = [
  { name: 'TypeScript', pattern: /\bTypeScript\b/i },
  { name: 'JavaScript', pattern: /\bJavaScript\b/i },
  { name: 'Python', pattern: /\bPython\b/i },
  { name: 'Rust', pattern: /\bRust\b/i },
  { name: 'Go', pattern: /\b(?:Golang|Go language)\b/i },
  { name: 'C++', pattern: /\bC\+\+\b/ },
  { name: 'C#', pattern: /\bC#\b/ },
  { name: 'Java', pattern: /\bJava\b/ },
  { name: 'Kotlin', pattern: /\bKotlin\b/i },
  { name: 'Swift', pattern: /\bSwift\b/i },
  { name: 'SQL', pattern: /\bSQL\b/ },
  { name: 'HTML', pattern: /\bHTML(?:5)?\b/i },
  { name: 'CSS', pattern: /\bCSS(?:3)?\b/i },
];

const KNOWN_FRAMEWORKS = [
  { name: 'React', pattern: /\bReact(?:\.js)?\b/i },
  { name: 'Vue', pattern: /\bVue(?:\.js)?\b/i },
  { name: 'Next.js', pattern: /\bNext(?:\.js)?\b/i },
  { name: 'Express', pattern: /\bExpress(?:\.js)?\b/i },
  { name: 'Tauri', pattern: /\bTauri\b/i },
  { name: 'Electron', pattern: /\bElectron\b/i },
  { name: 'Tailwind CSS', pattern: /\bTailwind(?:\s*CSS)?\b/i },
  { name: 'Node.js', pattern: /\bNode(?:\.js)?\b/i },
  { name: 'FastAPI', pattern: /\bFastAPI\b/i },
  { name: 'Vite', pattern: /\bVite\b/i },
  { name: 'Firebase', pattern: /\bFirebase\b/i },
  { name: 'Supabase', pattern: /\bSupabase\b/i },
  { name: 'PostgreSQL', pattern: /\bPostgreSQL|Postgres\b/i },
  { name: 'SQLite', pattern: /\bSQLite\b/i },
];

const KNOWN_SECURITY_TECH = [
  { name: 'AES-GCM', pattern: /\bAES-?(?:GCM|256-GCM)\b/i },
  { name: 'AES-CBC', pattern: /\bAES-?CBC\b/i },
  { name: 'PBKDF2', pattern: /\bPBKDF2\b/i },
  { name: 'Argon2', pattern: /\bArgon2\b/i },
  { name: 'SHA-256', pattern: /\bSHA-?256\b/i },
  { name: 'HMAC', pattern: /\bHMAC\b/i },
  { name: 'WebCrypto', pattern: /\bWebCrypto\b/i },
  { name: 'Zero-Knowledge', pattern: /\bZero-Knowledge\b/i },
  { name: 'TLS 1.3', pattern: /\bTLS(?:\s*1\.3)?\b/i },
  { name: 'End-to-End Encryption', pattern: /\bEnd-to-End\s+Encryption\b/i },
  { name: 'Client-Side Encryption', pattern: /\bClient-Side\s+Encryption\b/i },
];

const KNOWN_AI_CONCEPTS = [
  { name: 'Gemini API', pattern: /\bGemini(?:\s*API)?\b/i },
  { name: 'On-Device AI', pattern: /\bOn-Device(?:\s*AI)?\b/i },
  { name: 'Embeddings', pattern: /\bEmbeddings?\b/i },
  { name: 'Vector Index', pattern: /\bVector\s*(?:Index|Search|Database)\b/i },
  { name: 'RAG', pattern: /\bRAG\b|\bRetrieval-Augmented\s+Generation\b/i },
  { name: 'LLM', pattern: /\bLLM\b|\bLanguage\s*Model\b/i },
  { name: 'QNN', pattern: /\bQNN\b|\bSnapdragon\b/i },
  { name: 'Local Inference', pattern: /\bLocal\s*Inference\b/i },
];

export class ProjectAnalyzer {
  /**
   * Deterministically analyze extracted documents to produce structured ProjectKnowledge.
   * Every item includes full source file traceability.
   */
  static analyze(
    projectId: string,
    projectName: string,
    documents: ExtractedDocument[]
  ): ProjectKnowledge {
    const rawItems: KnowledgeItem[] = [];
    let problemStatement = '';
    let proposedSolution = '';
    let projectOverview = '';
    const goals: string[] = [];
    const technologies = new Set<string>();
    const frameworks = new Set<string>();
    const languages = new Set<string>();
    const architectureConcepts = new Set<string>();
    const features = new Set<string>();
    const importantTerms = new Set<string>();
    const securityConcepts = new Set<string>();
    const aiConcepts = new Set<string>();
    const potentialTopics = new Set<string>();

    const sourceFilesSummary = documents.map((doc) => ({
      fileId: doc.fileId,
      fileName: doc.title || 'Document',
      wordCount: doc.wordCount,
      extractedAt: doc.extractedAt,
    }));

    const totalWordCount = documents.reduce((acc, d) => acc + d.wordCount, 0);

    // Process each document
    for (const doc of documents) {
      const text = doc.text;
      const fileId = doc.fileId;
      const fileName = doc.title || 'Document';

      // 1. Overview heuristic extraction from top paragraph or lead-in
      if (!projectOverview) {
        const paragraphs = text.split('\n\n').map((p) => p.trim()).filter(Boolean);
        for (const p of paragraphs) {
          // If paragraph is not a single heading
          if (!p.startsWith('#') && p.length > 40 && p.length < 500) {
            projectOverview = p.replace(/\n/g, ' ');
            rawItems.push({
              id: `item-overview-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'overview',
              value: projectOverview,
              sourceFileId: fileId,
              sourceFileName: fileName,
              confidence: 'heuristic',
            });
            break;
          }
        }
      }

      // 2. Headings-based extraction: Problem, Solution, Goals, Architecture, Security, Defense
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Problem statement detection
        if (
          !problemStatement &&
          /^#+\s*(?:Problem|Problem Statement|The Problem|Challenge)\b/i.test(line)
        ) {
          let problemLines: string[] = [];
          for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
            const next = lines[j].trim();
            if (next.startsWith('#')) break;
            if (next) problemLines.push(next);
          }
          if (problemLines.length > 0) {
            problemStatement = problemLines.join(' ');
            rawItems.push({
              id: `item-problem-${fileId}`,
              type: 'problem',
              value: problemStatement,
              sourceFileId: fileId,
              sourceFileName: fileName,
              confidence: 'exact',
            });
          }
        }

        // Proposed Solution detection
        if (
          !proposedSolution &&
          /^#+\s*(?:Solution|Proposed Solution|The Solution|Approach)\b/i.test(line)
        ) {
          let solutionLines: string[] = [];
          for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
            const next = lines[j].trim();
            if (next.startsWith('#')) break;
            if (next) solutionLines.push(next);
          }
          if (solutionLines.length > 0) {
            proposedSolution = solutionLines.join(' ');
            rawItems.push({
              id: `item-solution-${fileId}`,
              type: 'solution',
              value: proposedSolution,
              sourceFileId: fileId,
              sourceFileName: fileName,
              confidence: 'exact',
            });
          }
        }

        // Architecture Concepts detection under architecture headings or bullet items
        if (/^#+\s*(?:Architecture|Core Principles|Threat Model|System Design)\b/i.test(line)) {
          for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
            const next = lines[j].trim();
            if (next.startsWith('#') && !next.startsWith('###')) break;
            if (/^[-*•\d.]\s+/.test(next)) {
              const cleanedItem = next.replace(/^[-*•\d.]\s+/, '').trim();
              if (cleanedItem.length > 4 && cleanedItem.length < 120) {
                architectureConcepts.add(cleanedItem);
                rawItems.push({
                  id: `item-arch-${fileId}-${j}`,
                  type: 'architecture',
                  value: cleanedItem,
                  sourceFileId: fileId,
                  sourceFileName: fileName,
                  confidence: 'exact',
                });
              }
            }
          }
        }

        // Defense Topics / Trade-offs detection
        if (/^#+\s*(?:Trade-offs|Defense|Potential Defense Topics|Key Decisions)\b/i.test(line)) {
          for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
            const next = lines[j].trim();
            if (next.startsWith('#') && !next.startsWith('###')) break;
            if (/^[-*•\d.]\s+/.test(next)) {
              const cleanedItem = next.replace(/^[-*•\d.]\s+/, '').trim();
              if (cleanedItem.length > 5 && cleanedItem.length < 140) {
                potentialTopics.add(cleanedItem);
                rawItems.push({
                  id: `item-topic-${fileId}-${j}`,
                  type: 'defense_topic',
                  value: cleanedItem,
                  sourceFileId: fileId,
                  sourceFileName: fileName,
                  confidence: 'exact',
                });
              }
            }
          }
        }
      }

      // 3. Deterministic dictionary scanning with boundary checks
      for (const lang of KNOWN_LANGUAGES) {
        if (lang.pattern.test(text)) {
          languages.add(lang.name);
          technologies.add(lang.name);
          rawItems.push({
            id: `item-lang-${lang.name}-${fileId}`,
            type: 'language',
            value: lang.name,
            sourceFileId: fileId,
            sourceFileName: fileName,
            confidence: 'exact',
          });
        }
      }

      for (const fw of KNOWN_FRAMEWORKS) {
        if (fw.pattern.test(text)) {
          frameworks.add(fw.name);
          technologies.add(fw.name);
          rawItems.push({
            id: `item-fw-${fw.name}-${fileId}`,
            type: 'framework',
            value: fw.name,
            sourceFileId: fileId,
            sourceFileName: fileName,
            confidence: 'exact',
          });
        }
      }

      for (const sec of KNOWN_SECURITY_TECH) {
        if (sec.pattern.test(text)) {
          securityConcepts.add(sec.name);
          technologies.add(sec.name);
          rawItems.push({
            id: `item-sec-${sec.name}-${fileId}`,
            type: 'security',
            value: sec.name,
            sourceFileId: fileId,
            sourceFileName: fileName,
            confidence: 'exact',
          });
        }
      }

      for (const ai of KNOWN_AI_CONCEPTS) {
        if (ai.pattern.test(text)) {
          aiConcepts.add(ai.name);
          technologies.add(ai.name);
          rawItems.push({
            id: `item-ai-${ai.name}-${fileId}`,
            type: 'ai_concept',
            value: ai.name,
            sourceFileId: fileId,
            sourceFileName: fileName,
            confidence: 'exact',
          });
        }
      }
    }

    return {
      projectId,
      projectName,
      projectDescription: projectOverview || undefined,
      problemStatement: problemStatement || undefined,
      proposedSolution: proposedSolution || undefined,
      goals,
      technologies: Array.from(technologies),
      frameworks: Array.from(frameworks),
      programmingLanguages: Array.from(languages),
      architectureConcepts: Array.from(architectureConcepts),
      features: Array.from(features),
      importantTerms: Array.from(importantTerms),
      securityConcepts: Array.from(securityConcepts),
      aiConcepts: Array.from(aiConcepts),
      potentialTopics: Array.from(potentialTopics),
      sourceFiles: sourceFilesSummary,
      rawItems,
      generatedAt: new Date().toISOString(),
      totalWordCount,
    };
  }
}
