import React from 'react';
import { BarChart3, Cpu, Sparkles, ArrowUpRight } from 'lucide-react';

export const BenchmarkPlaceholder: React.FC = () => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-8 sm:p-12 text-center shadow-xl shadow-black/25 backdrop-blur-sm transition-all">
      <div className="max-w-xl mx-auto flex flex-col items-center">
        {/* Glow Icon */}
        <div className="relative mb-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)]">
          <BarChart3 className="w-7 h-7 text-indigo-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          Benchmark Comparison Studio
        </h3>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-lg">
          Evaluate Kannada token efficiency, fertility scores, and semantic fidelity across{' '}
          <span className="text-zinc-300 font-medium">Llama 3</span>,{' '}
          <span className="text-zinc-300 font-medium">Gemma 2</span>, and{' '}
          <span className="text-zinc-300 font-medium">Mistral</span> models across representations E0 through E3.
        </p>

        {/* Informative placeholder chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-8">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-left">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Tokenizer Fertility</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Measures sub-word splitting ratio for Kannada conjuncts and characters.
            </p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-left">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Semantic Similarity</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Cosine similarity &amp; intent preservation between raw and minimized prompts.
            </p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-left">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              <span>E0–E3 Comparison</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Compare baseline, stopword trimming, morphological reduction, and dense representations.
            </p>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Benchmark suite loading pipeline ready</span>
        </div>
      </div>
    </div>
  );
};
