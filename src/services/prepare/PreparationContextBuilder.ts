import { ProjectContext } from '../../types/knowledge';
import { PreparationPreferences } from '../../types/prepare';
import { SourceReference } from '../../types/ai';
import { projectKnowledgeRepository } from '../knowledge/ProjectKnowledgeRepository';

export interface PreparationAnalysisRequest {
  projectId: string;
  projectName: string;
  preferences: PreparationPreferences;
  context: {
    systemContextPrompt: string;
    overview?: string;
    problem?: string;
    solution?: string;
    technologies: string[];
    frameworks: string[];
    languages: string[];
    architecture: string[];
    security: string[];
    potentialTopics?: string[];
    sourceAttributions: SourceReference[];
    documentSnippets: {
      fileName: string;
      text: string;
    }[];
  };
}

export class PreparationContextBuilder {
  static buildRequest(
    projectId: string,
    projectName: string,
    preferences: PreparationPreferences,
    context: ProjectContext
  ): PreparationAnalysisRequest {
    const sourceAttributions: SourceReference[] = context.sources.map((s) => ({
      fileId: s.fileId,
      fileName: s.fileName,
      wordCount: s.wordCount,
    }));

    // Retrieve extracted documents to include relevant snippets
    const extractedDocs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
    const documentSnippets: { fileName: string; text: string }[] = [];

    // Prioritize key sections: architectural files, security notes, specs, readme
    for (const doc of extractedDocs) {
      const fileName = doc.title || 'Document';
      const text = doc.text.trim();
      if (!text) continue;

      // Take first ~1500 chars of each document or paragraphs to stay compact and token-efficient
      const paragraphs = text.split('\n\n').map((p) => p.trim()).filter(Boolean);
      const selected = paragraphs.slice(0, 4).join('\n\n');

      documentSnippets.push({
        fileName,
        text: selected.length > 2000 ? selected.slice(0, 2000) + '...' : selected,
      });
    }

    const contextLines: string[] = [];
    contextLines.push(`PROJECT NAME: "${projectName}"`);
    if (context.overview) {
      contextLines.push(`OVERVIEW: ${context.overview}`);
    }
    if (context.problem) {
      contextLines.push(`PROBLEM: ${context.problem}`);
    }
    if (context.solution) {
      contextLines.push(`SOLUTION: ${context.solution}`);
    }
    if (context.technologies && context.technologies.length > 0) {
      contextLines.push(`TECHNOLOGIES: ${context.technologies.join(', ')}`);
    }
    if (context.frameworks && context.frameworks.length > 0) {
      contextLines.push(`FRAMEWORKS: ${context.frameworks.join(', ')}`);
    }
    if (context.architecture && context.architecture.length > 0) {
      contextLines.push(`ARCHITECTURE:\n- ${context.architecture.join('\n- ')}`);
    }
    if (context.security && context.security.length > 0) {
      contextLines.push(`SECURITY PRIMITIVES:\n- ${context.security.join('\n- ')}`);
    }
    if (context.potentialTopics && context.potentialTopics.length > 0) {
      contextLines.push(`POTENTIAL TOPICS:\n- ${context.potentialTopics.join('\n- ')}`);
    }

    if (documentSnippets.length > 0) {
      contextLines.push('\n--- EXTRACTED PROJECT MATERIAL SNIPPETS ---');
      for (const snippet of documentSnippets) {
        contextLines.push(`[File: ${snippet.fileName}]\n${snippet.text}`);
      }
    }

    const systemContextPrompt = contextLines.join('\n\n');

    return {
      projectId,
      projectName,
      preferences,
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
        potentialTopics: context.potentialTopics,
        sourceAttributions,
        documentSnippets,
      },
    };
  }
}
