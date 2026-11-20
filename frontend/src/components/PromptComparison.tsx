import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { KSmartResponse } from '../types/ksmart';

interface PromptComparisonProps {
  data: KSmartResponse;
}

export const PromptComparison: React.FC<PromptComparisonProps> = ({ data }) => {
  const { original, selected } = data;

  const originalTokens = original.tokens;
  const optimizedTokens = selected.tokens;
  const optimizedPrompt = selected.text;

  const compressionRatio =
    optimizedTokens > 0 ? (originalTokens / optimizedTokens).toFixed(2) : '1.00';
  const charsPerToken =
    optimizedTokens > 0 ? (optimizedPrompt.length / optimizedTokens).toFixed(1) : '0.0';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl shadow-black/20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Prompt Comparison</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Strategy: {selected.strategy}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
            Compression: {compressionRatio}×
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Density: {charsPerToken} chars/tok
          </span>
        </div>
        <div className="text-xs font-semibold text-emerald-400">
          {selected.savings_percent > 0 ? (
            <span>+{selected.savings_percent.toFixed(1)}% Token Savings</span>
          ) : (
            <span className="text-zinc-400">Zero Semantic Distortion (Passthrough)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              Original Prompt
            </span>
            <span className="font-mono text-zinc-500">{original.tokens} tokens</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            {original.text}
          </p>
        </div>

        <div className="bg-zinc-950/80 border border-indigo-500/30 rounded-lg p-3.5 relative">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="font-medium text-indigo-300 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              Selected Optimized Prompt
            </span>
            <span className="font-mono text-emerald-400 font-semibold">
              {selected.tokens} tokens (-{selected.tokens_saved})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-sans font-medium">
            {selected.text}
          </p>
        </div>
      </div>
    </div>
  );
};
