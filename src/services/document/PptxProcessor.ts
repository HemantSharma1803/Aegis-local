import { DocumentProcessor, ProcessingResult, ExtractedDocument } from '../../types/knowledge';
import { TextNormalizer } from './TextNormalizer';
import JSZip from 'jszip';

export class PptxProcessor implements DocumentProcessor {
  id = 'pptx-processor';
  name = 'PowerPoint PPTX Processor';
  supportedExtensions = ['pptx'];

  isSupported(extension: string): boolean {
    return extension.toLowerCase() === 'pptx';
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
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Find all slide XML files in ppt/slides/
        const slidePaths = Object.keys(zip.files).filter((path) =>
          /^ppt\/slides\/slide\d+\.xml$/.test(path)
        );

        // Sort naturally by slide number (slide1, slide2, slide3, ...)
        slidePaths.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          return numA - numB;
        });

        if (slidePaths.length > 0) {
          const slideOutputs: string[] = [];

          for (let i = 0; i < slidePaths.length; i++) {
            const slidePath = slidePaths[i];
            const slideNum = i + 1;
            const xmlText = await zip.file(slidePath)?.async('text');

            if (!xmlText) continue;

            const slideLines: string[] = [];
            const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

            if (parser) {
              const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
              const paragraphs = Array.from(xmlDoc.getElementsByTagName('a:p'));

              for (const p of paragraphs) {
                const textNodes = Array.from(p.getElementsByTagName('a:t'));
                const pText = textNodes.map((n) => n.textContent || '').join('');
                if (pText.trim().length > 0) {
                  slideLines.push(pText.trim());
                }
              }
            } else {
              // Regex fallback
              const textMatches = xmlText.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
              if (textMatches) {
                slideLines.push(
                  textMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ')
                );
              }
            }

            // Check for optional speaker notes for this slide
            const notePath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
            if (zip.file(notePath)) {
              try {
                const noteXml = await zip.file(notePath)?.async('text');
                if (noteXml) {
                  const noteMatches = noteXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
                  if (noteMatches) {
                    const noteText = noteMatches
                      .map((m) => m.replace(/<[^>]+>/g, '').trim())
                      .filter(Boolean)
                      .join(' ');
                    if (noteText.trim()) {
                      slideLines.push(`[Speaker Notes]: ${noteText}`);
                    }
                  }
                }
              } catch {
                // Ignore note errors
              }
            }

            if (slideLines.length > 0) {
              slideOutputs.push(`--- Slide ${slideNum} ---\n${slideLines.join('\n')}`);
            }
          }

          if (slideOutputs.length > 0) {
            rawText = slideOutputs.join('\n\n');
          }
        }
      }

      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          isSupported: true,
          error:
            'No readable text found in PowerPoint presentation. Slides may contain only non-OCR images, vectors, or empty layouts.',
        };
      }

      const normalized = TextNormalizer.normalize(rawText);

      if (normalized.isEmpty) {
        return {
          success: false,
          isSupported: true,
          error: 'PowerPoint document contains only whitespace or unprintable characters.',
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
      console.error('[PptxProcessor] PPTX extraction failure:', err);
      return {
        success: false,
        isSupported: true,
        error: `PPTX extraction error: ${err?.message || 'Unknown presentation parsing error'}`,
      };
    }
  }
}
