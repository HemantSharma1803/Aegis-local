import { DocumentProcessor, ProcessingResult, ExtractedDocument } from '../../types/knowledge';
import { TextNormalizer } from './TextNormalizer';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export class DocxProcessor implements DocumentProcessor {
  id = 'docx-processor';
  name = 'Word DOCX Document Processor';
  supportedExtensions = ['docx'];

  isSupported(extension: string): boolean {
    return extension.toLowerCase() === 'docx';
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

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();

        // 1. Primary extractor: mammoth
        try {
          const mammothResult = await mammoth.extractRawText({ arrayBuffer });
          if (mammothResult && mammothResult.value && mammothResult.value.trim().length > 0) {
            rawText = mammothResult.value;
          }
        } catch (mErr) {
          console.warn('[DocxProcessor] Mammoth extraction attempt failed, falling back to direct OpenXML XML parsing:', mErr);
        }

        // 2. Secondary fallback: JSZip direct OpenXML parsing of word/document.xml
        if (!rawText || rawText.trim().length === 0) {
          try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const docXml = await zip.file('word/document.xml')?.async('text');
            if (docXml) {
              const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
              if (parser) {
                const xmlDoc = parser.parseFromString(docXml, 'application/xml');
                const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
                const lines: string[] = [];
                for (const p of paragraphs) {
                  const texts = Array.from(p.getElementsByTagName('w:t')).map((t) => t.textContent || '');
                  const pText = texts.join('');
                  if (pText.trim()) lines.push(pText);
                }
                rawText = lines.join('\n\n');
              } else {
                // Regex fallback for text runs
                const matches = docXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
                if (matches) {
                  rawText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
                }
              }
            }
          } catch (zipErr) {
            console.warn('[DocxProcessor] Direct OpenXML parsing fallback failed:', zipErr);
          }
        }
      }

      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          isSupported: true,
          error: 'Could not extract text content from Word document. The file may be password-protected or corrupted.',
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
      console.error('[DocxProcessor] Extraction failure:', err);
      return {
        success: false,
        isSupported: true,
        error: `DOCX extraction failed: ${err?.message || 'Unknown parsing error'}`,
      };
    }
  }
}
