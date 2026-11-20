import React, { useEffect } from 'react';
import { X, Layers, Cpu, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGES = [
  {
    step: 'Stage 1',
    title: 'Text & Whitespace Normalization',
    subtitle: 'Canonical Cleanup & Redundant Whitespace Removal',
    description:
      'Performs canonical text normalization and removes excessive whitespace, repeated punctuation, boilerplate conversational fillers, and zero-width artifacts that needlessly inflate sub-word token counts.',
    badge: 'Normalization',
    icon: <Cpu className="w-4 h-4 text-sky-400" />,
  },
  {
    step: 'Stage 2',
    title: 'Multi-Strategy Candidate Generation',
    subtitle: 'Concurrent Multi-Channel Representations',
    description:
      'Generates concise, structured, and compressed prompt variants across parallel strategies to explore the optimal token-reduction frontier while preserving core user intent.',
    badge: 'Multi-Channel',
    icon: <Layers className="w-4 h-4 text-indigo-400" />,
  },
  {
    step: 'Stage 3',
    title: 'Semantic Similarity Guard',
    subtitle: 'Embedding-Based Meaning Preservation Verifier',
    description:
      'Computes semantic similarity against the original prompt embedding. Candidates dropping below the target threshold are rejected immediately to eliminate factual drift or hallucination.',
    badge: 'Fidelity Guard',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  },
  {
    step: 'Stage 4',
    title: 'Token-Optimal Selection & Fallback',
    subtitle: 'Pareto-Optimal Representation Dispatch',
    description:
      'Selects the lowest-token passing candidate that guarantees meaning retention. Adaptively falls back to the original unaltered prompt whenever compression compromises clarity or for short atomic queries.',
    badge: 'Adaptive Fallback',
    icon: <Sparkles className="w-4 h-4 text-violet-400" />,
  },
];

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6 text-left relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
                  K-SMART 4-Stage Middleware Architecture
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v0.1 Spec
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Semantic-Preserving Prompt Optimization &amp; Token Telemetry Middleware
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Architecture Stages */}
        <div className="space-y-3">
          {STAGES.map((s, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-start gap-3.5 group"
            >
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 group-hover:border-indigo-500/40 transition-colors">
                {s.icon}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      {s.step}
                    </span>
                    <span className="text-sm font-semibold text-zinc-200">{s.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {s.badge}
                  </span>
                </div>
                <div className="text-xs font-medium text-zinc-400">{s.subtitle}</div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1 font-sans">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info strip */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Semantic fidelity guarded with token-optimal dispatch</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};
