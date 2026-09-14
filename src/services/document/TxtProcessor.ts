import { DocumentProcessor, ProcessingResult, ExtractedDocument } from '../../types/knowledge';
import { TextNormalizer } from './TextNormalizer';

export class TxtProcessor implements DocumentProcessor {
  id = 'txt-processor';
  name = 'Plain Text Processor';
  supportedExtensions = ['txt'];

  isSupported(extension: string): boolean {
    return extension.toLowerCase() === 'txt';
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
          error: 'Document is empty or could not be read.',
        };
      }

      const normalized = TextNormalizer.normalize(rawText);

      if (normalized.isEmpty) {
        return {
          success: false,
          isSupported: true,
          error: 'Document contains only whitespace or unprintable characters.',
        };
      }

      const doc: ExtractedDocument = {
        fileId,
        projectId,
        title: file.name,
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
        error: `Text extraction failed: ${err.message || 'Unknown error'}`,
      };
    }
  }
}
