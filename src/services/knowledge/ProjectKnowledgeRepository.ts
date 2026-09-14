import { ProjectKnowledge, ExtractedDocument } from '../../types/knowledge';

const STORAGE_PREFIX_KNOWLEDGE = 'aegis_local_knowledge_';
const STORAGE_PREFIX_DOCUMENTS = 'aegis_local_extracted_docs_';

export class ProjectKnowledgeRepository {
  private getKnowledgeKey(projectId: string): string {
    return `${STORAGE_PREFIX_KNOWLEDGE}${projectId}`;
  }

  private getDocumentsKey(projectId: string): string {
    return `${STORAGE_PREFIX_DOCUMENTS}${projectId}`;
  }

  // --- Extracted Documents Methods ---

  saveExtractedDocument(doc: ExtractedDocument): void {
    try {
      const docs = this.getExtractedDocumentsByProjectId(doc.projectId);
      const filtered = docs.filter((d) => d.fileId !== doc.fileId);
      filtered.push(doc);
      localStorage.setItem(this.getDocumentsKey(doc.projectId), JSON.stringify(filtered));
    } catch (err) {
      console.error('[ProjectKnowledgeRepository] Failed to save extracted document:', err);
    }
  }

  getExtractedDocumentsByProjectId(projectId: string): ExtractedDocument[] {
    try {
      const raw = localStorage.getItem(this.getDocumentsKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[ProjectKnowledgeRepository] Failed to load extracted documents:', err);
      return [];
    }
  }

  removeExtractedDocument(projectId: string, fileId: string): void {
    try {
      const docs = this.getExtractedDocumentsByProjectId(projectId);
      const nextDocs = docs.filter((d) => d.fileId !== fileId);
      localStorage.setItem(this.getDocumentsKey(projectId), JSON.stringify(nextDocs));
    } catch (err) {
      console.error('[ProjectKnowledgeRepository] Failed to remove extracted document:', err);
    }
  }

  // --- Project Knowledge Methods ---

  saveKnowledge(knowledge: ProjectKnowledge): void {
    try {
      const key = this.getKnowledgeKey(knowledge.projectId);
      localStorage.setItem(key, JSON.stringify(knowledge));
    } catch (err) {
      console.error('[ProjectKnowledgeRepository] Failed to persist project knowledge:', err);
    }
  }

  getKnowledgeByProjectId(projectId: string): ProjectKnowledge | null {
    try {
      const key = this.getKnowledgeKey(projectId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as ProjectKnowledge;
    } catch (err) {
      console.warn('[ProjectKnowledgeRepository] Failed to get knowledge:', err);
      return null;
    }
  }

  clearKnowledgeByProjectId(projectId: string): void {
    try {
      localStorage.removeItem(this.getKnowledgeKey(projectId));
      localStorage.removeItem(this.getDocumentsKey(projectId));
    } catch (err) {
      console.error('[ProjectKnowledgeRepository] Failed to clear project knowledge:', err);
    }
  }
}

export const projectKnowledgeRepository = new ProjectKnowledgeRepository();
