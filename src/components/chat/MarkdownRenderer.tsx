import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-xs leading-relaxed text-zinc-200">
      {parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code block
          const lines = part.slice(3, -3).trim().split('\n');
          const language = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
          const codeBody = language ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={pIdx}
              className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 font-mono"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
                <span>{language || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(codeBody, pIdx)}
                  className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedIndex === pIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11px] text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Standard text with paragraphs, bullet points, headers, bold, and inline code
        const paragraphs = part.split(/\n\n+/);
        return (
          <div key={pIdx} className="space-y-2">
            {paragraphs.map((para, paraIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Heading 1 (#)
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={paraIdx} className="text-sm font-bold text-zinc-100 mt-2 mb-1">
                    {renderInline(trimmed.replace(/^#\s+/, ''))}
                  </h2>
                );
              }

              // Heading 2 (##)
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={paraIdx} className="text-xs font-bold text-zinc-200 uppercase tracking-wide font-mono mt-2 mb-1">
                    {renderInline(trimmed.replace(/^##\s+/, ''))}
                  </h3>
                );
              }

              // Heading 3 (###)
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={paraIdx} className="text-xs font-semibold text-zinc-300 mt-1.5 mb-0.5">
                    {renderInline(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }

              // List items
              if (trimmed.split('\n').some((l) => /^\s*[-*•\d.]\s+/.test(l))) {
                const listLines = trimmed.split('\n');
                return (
                  <ul key={paraIdx} className="space-y-1 my-1 pl-4 list-disc text-zinc-300">
                    {listLines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^\s*[-*•\d.]\s+/, '');
                      return <li key={lIdx}>{renderInline(cleanLine)}</li>;
                    })}
                  </ul>
                );
              }

              return (
                <p key={paraIdx} className="leading-relaxed text-zinc-200">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  // Regex to match bold (**text**) and inline code (`code`)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return tok;
  });
}
