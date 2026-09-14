import { ProjectContext } from '../../types/knowledge';
import { AIRequest, SourceReference } from '../../types/ai';
import { projectKnowledgeRepository } from '../knowledge/ProjectKnowledgeRepository';

export class AIContextBuilder {
  /**
   * Constructs compact, grounded context payload for a given question and active project.
   * Prioritizes relevant knowledge and sources while keeping prompt token-efficient.
   */
  static buildRequest(
    projectId: string,
    projectName: string,
    question: string,
    context: ProjectContext,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): AIRequest {
    // 1. Gather real source attributions from ProjectContext
    const sourceAttributions: SourceReference[] = context.sources.map((s) => ({
      fileId: s.fileId,
      fileName: s.fileName,
      wordCount: s.wordCount,
    }));

    // 2. Retrieve extracted documents for this project to extract relevant snippets
    const extractedDocs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
    const documentSnippets: { fileName: string; text: string }[] = [];

    // Simple keyword / heuristic relevance scoring to avoid unbounded prompt dumping
    const terms = question
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);

    for (const doc of extractedDocs) {
      const fileName = doc.title || 'Document';
      const paragraphs = doc.text.split('\n\n').map((p) => p.trim()).filter(Boolean);

      // Filter paragraphs matching question terms, or take the first 3 paragraphs if no specific term matches
      const relevantParas = paragraphs.filter((p) => {
        const lower = p.toLowerCase();
        return terms.some((t) => lower.includes(t));
      });

      const selected = relevantParas.length > 0 ? relevantParas.slice(0, 4) : paragraphs.slice(0, 2);
      if (selected.length > 0) {
        documentSnippets.push({
          fileName,
          text: selected.join('\n\n'),
        });
      }
    }

    // 3. Build the structured grounding prompt text
    const contextLines: string[] = [];

    contextLines.push(`PROJECT NAME: "${projectName}"`);
    if (context.overview) {
      contextLines.push(`PROJECT OVERVIEW: ${context.overview}`);
    }
    if (context.problem) {
      contextLines.push(`PROBLEM STATEMENT: ${context.problem}`);
    }
    if (context.solution) {
      contextLines.push(`PROPOSED SOLUTION: ${context.solution}`);
    }
    if (context.technologies && context.technologies.length > 0) {
      contextLines.push(`IDENTIFIED TECHNOLOGIES: ${context.technologies.join(', ')}`);
    }
    if (context.architecture && context.architecture.length > 0) {
      contextLines.push(`ARCHITECTURE PRINCIPLES & CONCEPTS:\n- ${context.architecture.join('\n- ')}`);
    }
    if (context.security && context.security.length > 0) {
      contextLines.push(`SECURITY PRIMITIVES & CONTROLS:\n- ${context.security.join('\n- ')}`);
    }
    if (context.potentialTopics && context.potentialTopics.length > 0) {
      contextLines.push(`POTENTIAL DEFENSE TOPICS:\n- ${context.potentialTopics.join('\n- ')}`);
    }

    if (documentSnippets.length > 0) {
      contextLines.push('\n--- RELEVANT DOCUMENT EXCERPTS ---');
      for (const snippet of documentSnippets) {
        contextLines.push(`[Source: ${snippet.fileName}]\n${snippet.text}`);
      }
    }

    const systemContextPrompt = contextLines.join('\n\n');

    // Return the sanitized AIRequest
    return {
      operation: 'ask',
      projectId,
      projectName,
      question,
      prompt: question,
      context: {
        systemContextPrompt,
        overview: context.overview,
        problem: context.problem,
        solution: context.solution,
        technologies: context.technologies,
        frameworks: context.frameworks,
        languages: context.languages,
        architecture: context.architecture,
        security: context.security,
        sourceAttributions,
        documentSnippets,
      },
      conversationHistory: conversationHistory.slice(-6), // Keep last 3 turns for focused follow-ups
    };
  }

  /**
   * Builds general AIRequest for specific operations like prepare, judge, voice-analysis
   */
  static buildOperationRequest(
    operation: 'ask' | 'prepare' | 'judge' | 'voice-analysis' | 'summarize' | 'extract' | 'classify',
    projectId: string,
    projectName: string,
    prompt: string,
    context: ProjectContext,
    extraMetadata?: Record<string, any>
  ): AIRequest {
    const base = this.buildRequest(projectId, projectName, prompt, context);
    return {
      ...base,
      operation,
      prompt,
      metadata: extraMetadata,
    };
  }
}

