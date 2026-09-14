import { ProjectContext, ProjectKnowledge } from '../../types/knowledge';
import { projectKnowledgeRepository } from './ProjectKnowledgeRepository';
import { documentProcessorRegistry } from '../document/DocumentProcessorRegistry';
import { ProjectAnalyzer } from './ProjectAnalyzer';
import { ProjectFile } from '../../types/file';
import { fileRepository } from '../fileRepository';

export class ProjectContextService {
  /**
   * Return clean structured project context for downstream use (ProjectPage, Ask Aegis, Prepare Me).
   */
  getContext(projectId: string): ProjectContext {
    const knowledge = projectKnowledgeRepository.getKnowledgeByProjectId(projectId);

    if (!knowledge || knowledge.sourceFiles.length === 0) {
      return {
        projectId,
        overview: '',
        problem: '',
        solution: '',
        technologies: [],
        frameworks: [],
        languages: [],
        architecture: [],
        features: [],
        security: [],
        ai: [],
        potentialTopics: [],
        sources: [],
        lastUpdated: '',
        hasExtractedKnowledge: false,
      };
    }

    return {
      projectId,
      overview: knowledge.projectDescription || '',
      problem: knowledge.problemStatement || '',
      solution: knowledge.proposedSolution || '',
      technologies: knowledge.technologies,
      frameworks: knowledge.frameworks,
      languages: knowledge.programmingLanguages,
      architecture: knowledge.architectureConcepts,
      features: knowledge.features,
      security: knowledge.securityConcepts,
      ai: knowledge.aiConcepts,
      potentialTopics: knowledge.potentialTopics,
      sources: knowledge.sourceFiles.map((s) => ({
        fileId: s.fileId,
        fileName: s.fileName,
        wordCount: s.wordCount,
      })),
      lastUpdated: knowledge.generatedAt,
      hasExtractedKnowledge: true,
    };
  }

  /**
   * Process a single file, updating the project's extracted documents and generating knowledge.
   */
  async processFile(
    projectId: string,
    projectName: string,
    file: File | ProjectFile,
    isDemo: boolean = false
  ): Promise<{ success: boolean; error?: string; unsupportedReason?: string }> {
    const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
    const processor = documentProcessorRegistry.getProcessorForExtension(ext);

    if (!processor) {
      return {
        success: false,
        error: `No document processor available for .${ext} format.`,
      };
    }

    // Retrieve file preview text or fallback if available
    let fallbackText: string | undefined = undefined;
    if (isDemo || !(file instanceof File)) {
      const preview = await fileRepository.getFilePreviewContent(file as ProjectFile);
      if (preview.hasPreview && preview.content) {
        fallbackText = preview.content;
      }
    }

    const fileId = 'id' in file ? file.id : `file-${file.name}-${file.size}-${file.lastModified}`;
    const result = await processor.extractText(file, projectId, fileId, fallbackText);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        unsupportedReason: result.unsupportedReason,
      };
    }

    if (result.document) {
      projectKnowledgeRepository.saveExtractedDocument(result.document);
      // Re-run project analyzer across all extracted documents for this project
      const allDocs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
      const knowledge = ProjectAnalyzer.analyze(projectId, projectName, allDocs);
      projectKnowledgeRepository.saveKnowledge(knowledge);
    }

    return { success: true };
  }

  /**
   * Rebuild knowledge for a project by reprocessing all currently registered files.
   */
  async rebuildProjectKnowledge(
    projectId: string,
    projectName: string,
    files: ProjectFile[],
    isDemo: boolean = false
  ): Promise<ProjectKnowledge> {
    // 1. Clear previous extracted docs for this project
    projectKnowledgeRepository.clearKnowledgeByProjectId(projectId);

    // 2. Process each supported file
    for (const file of files) {
      await this.processFile(projectId, projectName, file, isDemo);
    }

    // 3. Retrieve final combined knowledge
    const knowledge =
      projectKnowledgeRepository.getKnowledgeByProjectId(projectId) ||
      ProjectAnalyzer.analyze(projectId, projectName, []);

    return knowledge;
  }

  /**
   * Remove a file's knowledge when a file is deleted from a project.
   */
  removeFileFromKnowledge(projectId: string, projectName: string, fileId: string): ProjectKnowledge {
    projectKnowledgeRepository.removeExtractedDocument(projectId, fileId);
    const remainingDocs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
    const updatedKnowledge = ProjectAnalyzer.analyze(projectId, projectName, remainingDocs);
    projectKnowledgeRepository.saveKnowledge(updatedKnowledge);
    return updatedKnowledge;
  }

  /**
   * Lightweight local retrieval layer based on actual extracted text chunks.
   * Deterministic, keyword-frequency ranked, 100% on-device.
   */
  searchProjectKnowledge(
    projectId: string,
    query: string,
    limit: number = 5
  ): Array<{
    projectId: string;
    fileId: string;
    fileName: string;
    sourceReference: string;
    snippet: string;
    relevanceScore: number;
  }> {
    const docs = projectKnowledgeRepository.getExtractedDocumentsByProjectId(projectId);
    if (!docs || docs.length === 0 || !query.trim()) {
      return [];
    }

    const terms = query
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);

    if (terms.length === 0) {
      return [];
    }

    const results: Array<{
      projectId: string;
      fileId: string;
      fileName: string;
      sourceReference: string;
      snippet: string;
      relevanceScore: number;
    }> = [];

    for (const doc of docs) {
      // Chunk document into paragraphs or ~300 character segments
      const paragraphs = doc.text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        const pLower = paragraph.toLowerCase();

        let matchCount = 0;
        for (const term of terms) {
          if (pLower.includes(term)) {
            matchCount++;
          }
        }

        if (matchCount > 0) {
          const relevanceScore = Math.min(100, Math.round((matchCount / terms.length) * 100));
          results.push({
            projectId,
            fileId: doc.fileId,
            fileName: doc.title,
            sourceReference: `${doc.title} [Section ${i + 1}]`,
            snippet: paragraph.slice(0, 300) + (paragraph.length > 300 ? '...' : ''),
            relevanceScore,
          });
        }
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results.slice(0, limit);
  }
}

export const projectContextService = new ProjectContextService();
