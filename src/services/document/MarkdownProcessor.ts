import { DocumentProcessor, ProcessingResult, ExtractedDocument } from '../../types/knowledge';
import { TextNormalizer } from './TextNormalizer';

export class MarkdownProcessor implements DocumentProcessor {
  id = 'markdown-processor';
  name = 'Markdown Document Processor';
  supportedExtensions = ['md', 'markdown'];

  isSupported(extension: string): boolean {
    const ext = extension.toLowerCase();
    return ext === 'md' || ext === 'markdown';
  }

  canExtract(): boolean {
    return true;
  }

  async extractText(
    file: File | { id: string; name: string; extension: string; size: number },
    projectId: string,
    fileId: string,
    fallbackText?: string
  ): Promise<ProcessingResult> {
    try {
      let rawText = fallbackText || '';

      if (!rawText && file instanceof File) {
        rawText = await file.text();
      }

      if (!rawText) {
        return {
          success: false,
          isSupported: true,
          error: 'Markdown document is empty or could not be read.',
        };
      }

      const normalized = TextNormalizer.normalize(rawText);

      if (normalized.isEmpty) {
        return {
          success: false,
          isSupported: true,
          error: 'Document contains no readable text content.',
        };
      }

      // Detect potential document title from top-level # heading if present
      let docTitle = file.name;
      const h1Match = normalized.text.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        docTitle = h1Match[1].trim();
      }

      const doc: ExtractedDocument = {
        fileId,
        projectId,
        title: docTitle,
        text: normalized.text,
        wordCount: normalized.wordCount,
        charCount: normalized.charCount,
        extractedAt: new Date().toISOString(),
        processor: this.id,
      };

      return {
        success: true,
        isSupported: true,
        document: doc,
      };
    } catch (err: any) {
      return {
        success: false,
        isSupported: true,
        error: `Markdown extraction failed: ${err.message || 'Unknown error'}`,
      };
    }
  }
}
