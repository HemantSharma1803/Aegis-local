import { DocumentProcessor, ProcessingResult, ExtractedDocument } from '../../types/knowledge';
import { TextNormalizer } from './TextNormalizer';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker safely for browser environments if available
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Ignore worker assignment error
  }
}

export class PdfProcessor implements DocumentProcessor {
  id = 'pdf-processor';
  name = 'PDF Document Processor';
  supportedExtensions = ['pdf'];

  isSupported(extension: string): boolean {
    return extension.toLowerCase() === 'pdf';
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

        try {
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
            useSystemFonts: true,
          });

          const pdf = await loadingTask.promise;
          const pageTexts: string[] = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageStrings = textContent.items
              .filter((item: any) => typeof item.str === 'string')
              .map((item: any) => item.str);

            const pageText = pageStrings.join(' ').trim();
            if (pageText) {
              pageTexts.push(`--- Page ${i} ---\n${pageText}`);
            }
          }

          if (pageTexts.length > 0) {
            rawText = pageTexts.join('\n\n');
          }
        } catch (pdfErr) {
          console.warn('[PdfProcessor] PDF.js extraction encountered an issue, trying text stream decoding:', pdfErr);

          // Fast text stream fallback for simple or uncompressed PDF streams
          try {
            const uint8 = new Uint8Array(arrayBuffer);
            const decoder = new TextDecoder('latin1');
            const binaryString = decoder.decode(uint8);

            // Extract content inside parenthesis in text blocks: (Some text) Tj or [(Some) (text)] TJ
            const textBlockMatches = binaryString.match(/\(([^()]{2,})\)\s*(?:Tj|'|")/g);
            if (textBlockMatches && textBlockMatches.length > 0) {
              const decoded = textBlockMatches
                .map((m) => m.replace(/^[()]+|[()\\'"\s]+$/g, '').trim())
                .filter((s) => s.length > 1 && !/^\d+$/.test(s));
              if (decoded.length > 5) {
                rawText = decoded.join(' ');
              }
            }
          } catch {
            // Ignore stream decode errors
          }
        }
      }

      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          isSupported: true,
          error:
            'Metadata import supported; no extractable text layer found in PDF (the document may be a scanned image or raster graphic).',
        };
      }

      const normalized = TextNormalizer.normalize(rawText);

      if (normalized.isEmpty) {
        return {
          success: false,
          isSupported: true,
          error: 'PDF contains only whitespace or unprintable characters.',
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
      console.error('[PdfProcessor] PDF extraction failure:', err);
      return {
        success: false,
        isSupported: true,
        error: `PDF extraction error: ${err?.message || 'Unknown PDF parsing error'}`,
      };
    }
  }
}
