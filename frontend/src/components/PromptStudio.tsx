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
  AlertCircle,
  Layers,
} from 'lucide-react';
import { OptimizationMode } from '../types';
import { ChatMessage, formatStrategyName } from '../types/ksmart';
import { getApiBaseUrl } from '../services/api';
import { PipelineStepper } from './PipelineStepper';
import { PromptComparison } from './PromptComparison';
import { CandidateAnalytics } from './CandidateAnalytics';
import { OptimizerComparisonCard } from './OptimizerComparisonCard';

interface PromptStudioProps {
  messages: ChatMessage[];
  isRunning: boolean;
  activeStep: number;
  onSendMessage: (text: string, mode: OptimizationMode) => void;
  mode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  error?: string | null;
  apiStatus?: 'connected' | 'offline' | 'checking' | null;
  onRetryHealth?: () => void;
}

const DEMO_SAMPLES = [
  {
    title: 'Verbose Travel Query',
    prompt:
      'Hello! Could you please give me a detailed list of the top 3 must-visit places in Bangalore along with a short description for each? Thank you so much!',
    badge: 'Verbose Prompt',
  },
  {
    title: 'Polite Coding Help',
    prompt:
      'Hi there, I really need a small favor—could you kindly explain the 4 best steps for a complete beginner to start learning Python programming? Thanks in advance.',
    badge: 'Polite Query',
  },
  {
    title: 'Short Atomic Query',
    prompt: 'What is the capital of India?',
    badge: 'Atomic Query',
  },
];

export const PromptStudio: React.FC<PromptStudioProps> = ({
  messages,
  isRunning,
  activeStep,
  onSendMessage,
  mode,
  onModeChange,
  error,
  apiStatus = 'checking',
  onRetryHealth,
}) => {
  const [input, setInput] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSamplesOpen, setIsSamplesOpen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<HTMLDivElement>(null);

  const isOffline = apiStatus === 'offline';

  // Close samples menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (samplesRef.current && !samplesRef.current.contains(e.target as Node)) {
        setIsSamplesOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSamplesOpen(false);
      }
    };
    if (isSamplesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSamplesOpen]);

  // Auto-expand latest assistant message by default, and ensure compare mode messages are auto-expanded
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
      messages.forEach((msg) => {
        if (msg.role === 'assistant' && (msg.mode === 'compare' || msg.mode === 'compare_all')) {
          setExpandedIds((prev) => {
            const next = new Set(prev);
            next.add(msg.id);
            return next;
          });
        }
      });
    }
  }, [messages]);

  // Smooth auto-scroll to bottom on new messages, prompt sending, or assistant replies
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRunning, activeStep, error]);

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

  const handleSelectSample = (samplePrompt: string) => {
    if (isOffline) return;
    setInput(samplePrompt);
    setIsSamplesOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
      }, 0);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isRunning || isOffline) return;

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

  // Shared Chat Input Component
  const renderInputBox = () => (
    <div className="w-full">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="mb-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-xs sm:text-sm font-medium">
              Backend API is offline. Connect backend at <span className="font-mono text-rose-200">{getApiBaseUrl()}</span> or check your FastAPI server.
            </span>
          </div>
          {onRetryHealth && (
            <button
              type="button"
              onClick={onRetryHealth}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-medium transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Live API Error Alert Banner (if error exists and not already offline) */}
      {!isOffline && error && (
        <div className="mb-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-xs sm:text-sm font-medium">{error}</span>
          </div>
          {onRetryHealth && (
            <button
              type="button"
              onClick={onRetryHealth}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Compact 4-Step Pipeline Stepper while generating */}
      {isRunning && (
        <div className="mb-3 animate-in fade-in duration-200">
          <PipelineStepper activeStep={activeStep} isRunning={isRunning} />
        </div>
      )}

      {/* Rounded Input Container */}
      <div className={`bg-zinc-900 border rounded-2xl p-3 shadow-xl transition-colors ${
        isOffline ? 'border-rose-900/40 opacity-70' : 'border-zinc-800 focus-within:border-zinc-700'
      }`}>
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          disabled={isOffline || isRunning}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isOffline
              ? 'Backend is offline. Check connection to send prompts...'
              : 'Enter a prompt to optimize and run...'
          }
          className="w-full bg-transparent border-0 text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none max-h-32 min-h-[44px] font-sans leading-relaxed disabled:cursor-not-allowed"
        />

        {/* Compact Bottom Toolbar inside Box */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            <label htmlFor="chat-mode" className="text-[11px] text-zinc-500 font-medium">
              Mode:
            </label>
            <select
              id="chat-mode"
              disabled={isOffline || isRunning}
              value={mode === 'compare_all' ? 'compare' : mode}
              onChange={(e) => onModeChange(e.target.value as OptimizationMode)}
              className="bg-zinc-950/90 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="adaptive">Adaptive Selection</option>
              <option value="compare">Compare All Strategies</option>
            </select>

            {/* Subtle Samples Menu Button */}
            <div className="relative" ref={samplesRef}>
              <button
                type="button"
                disabled={isOffline || isRunning}
                onClick={() => setIsSamplesOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                title="Inject a demo sample preset"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Samples</span>
              </button>

              {/* Upward-Opening Menu */}
              {isSamplesOpen && !isOffline && (
                <div className="absolute left-0 bottom-full mb-2 z-50 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl w-80 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                    <span>Sample Presets</span>
                    <span className="text-[9px] text-indigo-400 font-semibold">1-Click Inject</span>
                  </div>
                  {DEMO_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample.prompt)}
                      className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/80 transition-colors group cursor-pointer"
                    >
                      <div className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                        <span>{sample.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400/90">{sample.badge}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-sans">
                        {sample.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isRunning || isOffline}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            title="Send prompt (Enter)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Empty State: Greeting & Input grouped cleanly in the upper-center */}
      {messages.length === 0 ? (
        <div className="pt-10 sm:pt-14 flex flex-col items-center gap-6 max-w-3xl mx-auto px-4 w-full animate-in fade-in duration-300">
          {/* Centered Hero Greeting */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)] flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
              Hey! How can I help you today?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Optimize any prompt automatically with semantic-preserving minimization.
            </p>
          </div>

          {/* Input Box seated cleanly right below the hero */}
          {renderInputBox()}
        </div>
      ) : (
        /* Active Chat State: Clean thread starting right below navbar with input docked at bottom */
        <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-3xl mx-auto px-4 w-full pt-4 pb-6">
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
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
                            LLM
                          </span>
                        </div>

                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
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

                      {/* Head-to-Head Without Optimizer vs. With K-SMART Comparison Card */}
                      {msg.ksmartData && (
                        <div className="mt-3 animate-in fade-in duration-200">
                          <OptimizerComparisonCard data={msg.ksmartData} />
                        </div>
                      )}

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
                                {formatStrategyName(msg.ksmartData.selected.strategy)}
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
                                {msg.ksmartData.metrics.llm_latency_ms} ms LLM
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
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
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
                                {/* Multi-Strategy Breakdown strip if compare mode & candidates are present */}
                                {(msg.mode === 'compare' || msg.mode === 'compare_all' || mode === 'compare' || mode === 'compare_all') &&
                                  msg.ksmartData.candidates &&
                                  msg.ksmartData.candidates.length > 0 && (
                                    <div className="space-y-2 pb-3 border-b border-zinc-800/70">
                                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                                        <span className="flex items-center gap-1.5 text-indigo-300">
                                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                          Multi-Strategy Candidate Comparison
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                          Compare Mode Active
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {msg.ksmartData.candidates.slice(0, 4).map((c) => {
                                          const isWinner = c.strategy === msg.ksmartData?.selected.strategy;
                                          return (
                                            <div
                                              key={c.strategy}
                                              className={`rounded-xl p-2.5 flex flex-col justify-between ${
                                                isWinner
                                                  ? 'bg-indigo-950/30 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                                  : 'bg-zinc-900/90 border border-zinc-800'
                                              }`}
                                            >
                                              <div>
                                                <div className="flex items-center justify-between">
                                                  <span className={`text-[10px] font-mono font-bold ${
                                                    isWinner ? 'text-indigo-400' : 'text-zinc-400'
                                                  }`}>
                                                    {c.passed_guard ? 'PASS' : 'REJECT'}
                                                  </span>
                                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                                    {(c.similarity * 100).toFixed(0)}% Sim
                                                  </span>
                                                </div>
                                                <div className={`text-xs mt-1 truncate ${
                                                  isWinner ? 'font-bold text-indigo-200' : 'font-medium text-zinc-200'
                                                }`}>
                                                  {formatStrategyName(c.strategy)}
                                                </div>
                                              </div>
                                              <div className="mt-2 pt-1 border-t border-zinc-800/60 flex items-baseline justify-between">
                                                <span className="text-xs text-zinc-500">Tokens:</span>
                                                <span className={`text-sm font-bold font-mono ${
                                                  isWinner ? 'text-emerald-400' : 'text-zinc-300'
                                                }`}>
                                                  {c.tokens}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                <PromptComparison data={msg.ksmartData} />

                                {msg.ksmartData.candidates && msg.ksmartData.candidates.length > 0 && (
                                  <CandidateAnalytics data={msg.ksmartData} />
                                )}
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
            <div ref={bottomRef} />
          </div>

          {/* Docked bottom input bar */}
          <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md pt-2 pb-4">
            {renderInputBox()}
          </div>
        </div>
      )}
    </div>
  );
};
