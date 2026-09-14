import { DocumentProcessor } from '../../types/knowledge';
import { TxtProcessor } from './TxtProcessor';
import { MarkdownProcessor } from './MarkdownProcessor';
import { PdfProcessor } from './PdfProcessor';
import { DocxProcessor } from './DocxProcessor';
import { PptxProcessor } from './PptxProcessor';

export class DocumentProcessorRegistry {
  private processors: DocumentProcessor[] = [];

  constructor() {
    this.register(new TxtProcessor());
    this.register(new MarkdownProcessor());
    this.register(new PdfProcessor());
    this.register(new DocxProcessor());
    this.register(new PptxProcessor());
  }

  register(processor: DocumentProcessor): void {
    // Avoid duplicate registration
    this.processors = this.processors.filter((p) => p.id !== processor.id);
    this.processors.push(processor);
  }

  getProcessorForExtension(extension: string): DocumentProcessor | undefined {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return this.processors.find((p) => p.isSupported(ext));
  }

  isSupported(extension: string): boolean {
    return this.getProcessorForExtension(extension) !== undefined;
  }

  getAllProcessors(): DocumentProcessor[] {
    return [...this.processors];
  }
}

export const documentProcessorRegistry = new DocumentProcessorRegistry();
