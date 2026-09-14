import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { ChatMessage } from '../../types/ai';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRegenerate,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col space-y-1.5 ${
        isAssistant ? 'items-start' : 'items-end'
      } w-full max-w-3xl mx-auto py-2`}
    >
      {/* Sender Header */}
      <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-zinc-400">
        {isAssistant ? (
          <>
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Sparkles className="w-3 h-3" />
              AEGIS ASSISTANT
            </span>
            <span>•</span>
            <span>{message.timestamp}</span>
            {message.isGeneralKnowledge && (
              <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] text-amber-300">
                General explanation
              </span>
            )}
            {message.isGrounded && !message.isGeneralKnowledge && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/60 text-[10px] text-emerald-300">
                Based on your project
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-semibold text-zinc-300">YOU</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`rounded-2xl p-4.5 max-w-full sm:max-w-2xl text-xs leading-relaxed ${
          isAssistant
            ? 'bg-zinc-900/90 border border-zinc-800/90 text-zinc-200 shadow-sm'
            : 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-100'
        }`}
      >
        {isAssistant ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {isStreaming && (
          <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-400 animate-pulse" />
        )}

        {/* Source References Drawer / Accordion */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3 text-zinc-400" />
              <span>
                Sources ({message.sources.length} document{message.sources.length > 1 ? 's' : ''})
              </span>
              {showSources ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showSources && (
              <div className="mt-2 space-y-1.5">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono"
                  >
                    <span className="text-zinc-200 truncate">{src.fileName}</span>
                    {src.wordCount && (
                      <span className="text-zinc-500 text-[10px]">
                        {src.wordCount.toLocaleString()} words
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isAssistant && (!message.sources || message.sources.length === 0) && !isStreaming && (
          <div className="mt-2 text-[10px] font-mono text-zinc-500 italic">
            Source reference unavailable for this answer.
          </div>
        )}
      </div>

      {/* Action Footer (Copy / Regenerate for assistant) */}
      {isAssistant && !isStreaming && (
        <div className="flex items-center gap-2 px-1 pt-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onRegenerate && (
            <>
              <span className="text-zinc-700">•</span>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Regenerate answer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
