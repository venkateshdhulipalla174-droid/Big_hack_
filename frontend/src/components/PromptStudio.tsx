import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowUp,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { OptimizationMode } from '../types';
import { ChatMessage } from '../types/ksmart';
import { PipelineStepper } from './PipelineStepper';
import { PromptComparison } from './PromptComparison';
import { CandidateAnalytics } from './CandidateAnalytics';

interface PromptStudioProps {
  messages: ChatMessage[];
  isRunning: boolean;
  activeStep: number;
  onSendMessage: (text: string, mode: OptimizationMode) => void;
  mode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
}

const SUGGESTIONS = [
  {
    title: 'Top 3 places to visit in Bengaluru',
    prompt:
      'ದಯವಿಟ್ಟು ನನಗೆ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಭೇಟಿ ನೀಡಬಹುದಾದ 3 ಪ್ರಮುಖ ಪ್ರವಾಸಿ ಸ್ಥಳಗಳ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಮಾಹಿತಿ ನೀಡಿ. ತುಂಬಾ ಧನ್ಯವಾದಗಳು!',
  },
  {
    title: '4 steps to learn Python programming',
    prompt:
      'ನಮಸ್ಕಾರ, ನನಗೆ ಒಂದು ಸಹಾಯ ಬೇಕಿತ್ತು... ಪೈಥಾನ್ (Python) ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಭಾಷೆಯನ್ನು ಕಲಿಯಲು ಉತ್ತಮವಾದ 4 ಹಂತಗಳನ್ನು ದಯವಿಟ್ಟು ತಿಳಿಸಿಕೊಡಿ.',
  },
  {
    title: 'What is the capital of Karnataka?',
    prompt: 'ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಯಾವುದು?',
  },
];

export const PromptStudio: React.FC<PromptStudioProps> = ({
  messages,
  isRunning,
  activeStep,
  onSendMessage,
  mode,
  onModeChange,
}) => {
  const [input, setInput] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-expand latest assistant message by default
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.ksmartData) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(lastMsg.id);
          return next;
        });
      }
    }
  }, [messages]);

  // Scroll to bottom on new messages or step change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRunning, activeStep]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isRunning) return;

    onSendMessage(text, mode);
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-3xl mx-auto px-4 w-full">
      {/* Messages area or Empty State */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 px-2 animate-in fade-in duration-300">
          {/* Glowing Icon */}
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)] flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
            Hey! How can I help you today?
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            ನಮಸ್ಕಾರ! ಕೇಳಿ — K-SMART optimizes every prompt automatically.
          </p>

          {/* 3 Clickable Suggestion Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s.prompt)}
                className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-850 text-left transition-all duration-200 group flex flex-col justify-between shadow-md"
              >
                <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                  {s.title}
                </span>
                <span className="text-[11px] text-zinc-500 mt-2 line-clamp-2 font-sans">
                  {s.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isExpanded = expandedIds.has(msg.id);

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end animate-in fade-in duration-150">
                  <div className="bg-zinc-800 text-zinc-100 rounded-2xl px-4 py-3 max-w-[80%] ml-auto text-sm sm:text-base leading-relaxed font-sans shadow-md">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="w-full space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Glowing K-SMART Avatar Icon */}
                  <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.35)] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>

                  {/* Content Block */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">K-SMART</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Gemini
                        </span>
                      </div>

                      {/* Copy button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Answer Text */}
                    <div className="text-zinc-100 leading-relaxed whitespace-pre-line text-sm sm:text-base font-sans selection:bg-indigo-500/30 selection:text-white">
                      {msg.content}
                    </div>

                    {/* Compact K-SMART Measurable Impact Bar */}
                    {msg.ksmartData && (
                      <div className="mt-3 bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-lg">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            <span>K-SMART Measurable Impact</span>
                          </div>
                          <div className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>
                              Meaning Similarity:{' '}
                              {(msg.ksmartData.selected.similarity_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* 6 metrics responsive grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              Original Tokens
                            </span>
                            <span className="text-base font-bold text-zinc-200 font-mono block mt-0.5">
                              {msg.ksmartData.original.tokens}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              Baseline input
                            </span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              Optimized Tokens
                            </span>
                            <span className="text-base font-bold text-indigo-400 font-mono block mt-0.5">
                              {msg.ksmartData.selected.tokens}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate font-mono">
                              {msg.ksmartData.selected.strategy}
                            </span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              Tokens Saved
                            </span>
                            <span className="text-base font-bold text-emerald-400 font-mono block mt-0.5">
                              {msg.ksmartData.selected.savings_percent.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              -{msg.ksmartData.selected.tokens_saved} tokens
                            </span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              Processing Time
                            </span>
                            <span className="text-base font-bold text-sky-400 font-mono block mt-0.5">
                              {msg.ksmartData.metrics.optimization_latency_ms} ms
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              K-SMART engine
                            </span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              LLM Response Time
                            </span>
                            <span className="text-base font-bold text-violet-400 font-mono block mt-0.5">
                              {(msg.ksmartData.metrics.llm_latency_ms / 1000).toFixed(2)} s
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {msg.ksmartData.metrics.llm_latency_ms} ms Gemini
                            </span>
                          </div>
                          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5">
                            <span className="text-[11px] text-zinc-400 block truncate">
                              Total Overhead
                            </span>
                            <span className="text-base font-bold text-white font-mono block mt-0.5">
                              {(msg.ksmartData.metrics.total_latency_ms / 1000).toFixed(2)} s
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              Total (
                              {msg.ksmartData.metrics.total_latency_ms > 0
                                ? (
                                    (msg.ksmartData.metrics.optimization_latency_ms /
                                      msg.ksmartData.metrics.total_latency_ms) *
                                    100
                                  ).toFixed(1)
                                : '0'}
                              %)
                            </span>
                          </div>
                        </div>

                        {/* Expandable Prompt Diff & Candidate Analytics Toggle */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(msg.id)}
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isExpanded
                                ? 'Hide Prompt Diff & Candidates'
                                : 'Inspect Prompt Diff & Candidates'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-4 animate-in fade-in duration-200">
                              <PromptComparison data={msg.ksmartData} />
                              <CandidateAnalytics data={msg.ksmartData} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Sticky Bottom Chat Input Bar */}
      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md pt-2 pb-2">
        {/* Compact 4-Step Pipeline Stepper while generating */}
        {isRunning && (
          <div className="mb-3 animate-in fade-in duration-200">
            <PipelineStepper activeStep={activeStep} isRunning={isRunning} />
          </div>
        )}

        {/* ChatGPT / Gemini Style Rounded Input Container */}
        <div className="bg-zinc-900 border border-zinc-800 focus-within:border-zinc-700 rounded-2xl p-3 shadow-xl transition-colors">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message K-SMART..."
            className="w-full bg-transparent border-0 text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none max-h-32 min-h-[44px] font-sans leading-relaxed"
          />

          {/* Compact Bottom Toolbar inside Box */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <label htmlFor="chat-mode" className="text-[11px] text-zinc-500 font-medium">
                Mode:
              </label>
              <select
                id="chat-mode"
                value={mode}
                onChange={(e) => onModeChange(e.target.value as OptimizationMode)}
                className="bg-zinc-950/90 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="adaptive">Adaptive Selection</option>
                <option value="compare_all">Compare All E0–E3</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isRunning}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Send prompt"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
