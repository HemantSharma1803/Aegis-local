/**
 * TextNormalizer handles clean string normalization without destroying headings or meaningful markdown/plaintext structure.
 * It removes excessive whitespace, repeated blank lines, broken line endings, control characters,
 * and detects empty or short content.
 */

export interface NormalizationResult {
  text: string;
  wordCount: number;
  charCount: number;
  lineCount: number;
  isEmpty: boolean;
  isExtremelyShort: boolean;
}

export class TextNormalizer {
  /**
   * Normalize raw extracted text:
   * - standardizes \r\n, \r to \n
   * - strips unprintable/binary control chars while preserving \n, \t
   * - trims trailing whitespace on every line
   * - collapses 3+ consecutive newlines into 2 (preserves paragraph separation)
   * - removes zero-width spaces, BOM (U+FEFF), and null bytes
   */
  static normalize(raw: string): NormalizationResult {
    if (!raw || typeof raw !== 'string') {
      return {
        text: '',
        wordCount: 0,
        charCount: 0,
        lineCount: 0,
        isEmpty: true,
        isExtremelyShort: true,
      };
    }

    // 1. Remove Byte Order Mark (BOM) and null/control characters (except \n, \t)
    let cleaned = raw
      .replace(/^\uFEFF/, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Standardize line breaks to Unix \n
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 3. Trim trailing whitespace from each line while keeping heading and indent structures
    const lines = cleaned.split('\n').map((line) => line.replace(/[ \t]+$/g, ''));

    // 4. Collapse 3 or more consecutive blank lines down to max 2 blank lines (1 empty line between paragraphs)
    const collapsedLines: string[] = [];
    let consecutiveBlankLines = 0;

    for (const line of lines) {
      if (line.trim().length === 0) {
        consecutiveBlankLines++;
        if (consecutiveBlankLines <= 2) {
          collapsedLines.push('');
        }
      } else {
        consecutiveBlankLines = 0;
        collapsedLines.push(line);
      }
    }

    // 5. Trim leading and trailing empty lines from overall document
    const normalizedText = collapsedLines.join('\n').trim();

    // 6. Word count calculation using word boundary regex
    const words = normalizedText.match(/\b[\w'-]+\b/g) || [];
    const wordCount = words.length;
    const charCount = normalizedText.length;
    const lineCount = normalizedText.length > 0 ? normalizedText.split('\n').length : 0;

    return {
      text: normalizedText,
      wordCount,
      charCount,
      lineCount,
      isEmpty: charCount === 0,
      isExtremelyShort: wordCount < 5,
    };
  }
}
