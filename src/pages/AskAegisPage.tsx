import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  FolderOpen,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  Cpu,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { ChatMessage, AIRequest } from '../types/ai';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { chatHistoryService } from '../services/ai/ChatHistoryService';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { aiProviderRouter } from '../services/ai/AIProviderRouter';
import { AIContextBuilder } from '../services/ai/AIContextBuilder';
import { SnapdragonBadge } from '../components/ui/SnapdragonBadge';
import { AIProcessingLocation } from '../types/ai';

interface AskAegisPageProps {
  onOpenImportModal: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToProject?: () => void;
}

export const AskAegisPage: React.FC<AskAegisPageProps> = ({
  onOpenImportModal,
  onNavigateToSettings,
  onNavigateToProject,
}) => {
  const { activeProject, hasProject, loadDemoProject, projectContextData } = useProject();
  const { toast } = useToast();

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [activeProviderName, setActiveProviderName] = useState<string>('Google Gemini');
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);
  const [processingLocation, setProcessingLocation] = useState<AIProcessingLocation>('Not configured');


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggested grounded prompts
  const suggestedPrompts = [
    'Explain my project simply.',
    'What problem does my project solve?',
    'How does my architecture work?',
    'What technologies does my project use?',
    'What questions could a judge ask?',
    'Find a weakness in my approach.',
    'Help me explain my project in 60 seconds.',
  ];

  // Load project-scoped conversation history
  useEffect(() => {
    if (activeProject) {
      const history = chatHistoryService.getMessages(activeProject.id);
      setMessages(history);
    } else {
      setMessages([]);
    }
  }, [activeProject?.id]);

  // Check provider availability via Priority Router
  useEffect(() => {
    const checkProvider = async () => {
      const resolution = await aiProviderRouter.resolveProvider();
      setActiveProviderName(resolution.provider.name);
      setIsLocalMode(resolution.provider.capabilities.isLocal);
      setProviderAvailable(resolution.status.available);
      setProcessingLocation(resolution.status.processingLocation);
    };
    checkProvider();
  }, []);

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  const handleStartNewChat = () => {
    if (!activeProject) return;
    chatHistoryService.clearHistory(activeProject.id);
    setMessages([]);
    setStreamingText('');
    toast.info('New Chat', 'Started a fresh project-grounded conversation.');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (!activeProject) {
      toast.warning('Project Required', 'Create or open a project to ask Aegis questions.');
      return;
    }

    const resolution = await aiProviderRouter.resolveProvider();
    const provider = resolution.provider;
    const isAvailable = resolution.status.available;

    if (!isAvailable) {
      setProviderAvailable(false);
      setProcessingLocation(resolution.status.processingLocation);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const errorAssistantMsg: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        content: `AI processing unavailable: ${resolution.status.message} User question preserved. You can configure runtime preferences or enable cloud fallback in Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
        sources: [],
      };
      const updated = [...messages, userMsg, errorAssistantMsg];
      setMessages(updated);
      chatHistoryService.saveMessages(activeProject.id, updated);
      setInputValue('');
      return;
    }


    // 1. Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    chatHistoryService.saveMessages(activeProject.id, nextMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingText('');

    try {
      // 2. Build grounded AIRequest using active project context
      const conversationHistory = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const request: AIRequest = AIContextBuilder.buildRequest(
        activeProject.id,
        activeProject.name || activeProject.title,
        text,
        projectContextData,
        conversationHistory
      );

      // 3. Request answer with streaming if supported
      let accumulated = '';
      if (provider.streamQuestion) {
        const result = await provider.streamQuestion(request, (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        });

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.answer || accumulated,
          sources: result.sources || request.context.sourceAttributions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGrounded: result.grounded,
          isGeneralKnowledge: result.isGeneralKnowledge,
          providerName: result.provider,
        };

        const finalMessages = [...nextMessages, assistantMsg];
        setMessages(finalMessages);
        chatHistoryService.saveMessages(activeProject.id, finalMessages);
      } else {
        const result = await provider.answerQuestion(request);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          sources: result.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGrounded: result.grounded,
          isGeneralKnowledge: result.isGeneralKnowledge,
          providerName: result.provider,
        };

        const finalMessages = [...nextMessages, assistantMsg];
        setMessages(finalMessages);
        chatHistoryService.saveMessages(activeProject.id, finalMessages);
      }
    } catch (err: any) {
      console.error('[AskAegisPage] AI execution failed:', err);
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content:
          "I couldn't reach the configured AI provider. Check your AI settings and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
        error: true,
      };
      const finalMessages = [...nextMessages, errorMsg];
      setMessages(finalMessages);
      chatHistoryService.saveMessages(activeProject.id, finalMessages);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const handleRegenerateLast = async () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      const popped = [...messages];
      if (popped[popped.length - 1].role === 'assistant') {
        popped.pop();
        setMessages(popped);
      }
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-48px)] flex flex-col px-4 sm:px-6 py-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-100 uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              ASK AEGIS
            </h1>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">Your project, explained.</span>
          </div>
          {hasProject && activeProject && (
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span>Grounded in:</span>
              <span className="text-zinc-200 font-medium">{activeProject.name || activeProject.title}</span>
              {projectContextData.sources.length > 0 && (
                <span className="text-zinc-500">
                  ({projectContextData.sources.length} document source{projectContextData.sources.length > 1 ? 's' : ''})
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <SnapdragonBadge isActive={processingLocation === 'Snapdragon NPU'} />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <Cpu className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-500">AI:</span>
            <span className="truncate max-w-[140px]">{activeProviderName}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">Location:</span>
            <span
              className={
                processingLocation === 'Snapdragon NPU'
                  ? 'text-emerald-400 font-medium'
                  : processingLocation === 'Local / On-device'
                  ? 'text-emerald-400 font-medium'
                  : processingLocation === 'Cloud'
                  ? 'text-sky-400 font-medium'
                  : 'text-amber-400'
              }
            >
              {processingLocation}
            </span>
          </div>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartNewChat}
              icon={<Plus className="w-3 h-3" />}
            >
              New Chat
            </Button>
          )}
        </div>
      </div>

      {/* Main Conversation / Empty States Area */}
      {!hasProject ? (
        /* Empty State: No Active Project */
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            badgeText="PROJECT REQUIRED"
            icon={<Sparkles className="w-6 h-6 text-zinc-400" />}
            title="Create or open a project to ask Aegis questions."
            description="Aegis Local grounds all answers directly in your project documents, threat models, and architecture files."
            secondaryAction={
              <Button
                variant="outline"
                size="sm"
                onClick={loadDemoProject}
                icon={<FolderOpen className="w-3.5 h-3.5" />}
              >
                Open Demo Project
              </Button>
            }
          />
        </div>
      ) : !projectContextData.hasExtractedKnowledge &&
        (!activeProject.files || activeProject.files.length === 0) ? (
        /* Empty State: Active Project has no files */
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            badgeText="EMPTY CONTEXT"
            icon={<AlertCircle className="w-6 h-6 text-amber-400" />}
            title="Add project material before asking Aegis about your project."
            description="Aegis answers questions by analyzing your actual project documents and specifications. Add files to build project context."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenImportModal}
                icon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Import Files
              </Button>
            }
            secondaryAction={
              onNavigateToProject ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToProject}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Go to Project
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : messages.length === 0 ? (
        /* First-Time Chat Landing: Suggested Prompts */
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-zinc-100 font-mono uppercase tracking-tight">
              Project Knowledge Assistant
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Ask anything about <span className="text-zinc-200 font-medium">{activeProject.name}</span>. Aegis Local grounds responses directly in your project specifications and code files.
            </p>
          </div>

          <div className="w-full space-y-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Suggested Questions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Conversation History */
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {messages.map((msg, index) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onRegenerate={
                index === messages.length - 1 && msg.role === 'assistant'
                  ? handleRegenerateLast
                  : undefined
              }
            />
          ))}

          {/* Loading or Streaming Bubble */}
          {isLoading && (
            <div className="w-full max-w-3xl mx-auto py-2">
              <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  AEGIS ASSISTANT
                </span>
                <span>•</span>
                <span>Thinking about your project…</span>
              </div>

              <div className="rounded-2xl p-4.5 max-w-full sm:max-w-2xl text-xs leading-relaxed bg-zinc-900/90 border border-zinc-800/90 text-zinc-200">
                {streamingText ? (
                  <ChatMessageItem
                    message={{
                      id: 'streaming-temp',
                      role: 'assistant',
                      content: streamingText,
                      timestamp: 'Now',
                      sources: projectContextData.sources,
                      isGrounded: true,
                    }}
                    isStreaming={true}
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono py-1">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>Thinking about your project…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Unconfigured Provider Banner */}
      {providerAvailable === false && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>AI provider not configured.</span>
          </div>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="text-amber-300 hover:text-amber-100 underline font-mono text-[11px] cursor-pointer"
            >
              Configure AI in Settings
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="pt-2 border-t border-zinc-800/80 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative rounded-2xl bg-zinc-950 border border-zinc-800 focus-within:border-zinc-700 transition-colors p-2"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!hasProject || isLoading}
            placeholder={
              !hasProject
                ? 'Select or create a project to ask questions...'
                : 'Ask a project-grounded question (e.g. "What technologies does my project use?")...'
            }
            rows={2}
            className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none px-2 py-1 max-h-32"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-zinc-900 text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>Enter to send · Shift+Enter for newline</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!hasProject || !inputValue.trim() || isLoading}
              icon={
                isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )
              }
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
