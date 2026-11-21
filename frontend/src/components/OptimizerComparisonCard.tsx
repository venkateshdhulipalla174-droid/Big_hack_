import React from 'react';
import { Sparkles } from 'lucide-react';
import { KSmartResponse } from '../types/ksmart';

interface OptimizerComparisonCardProps {
  data: KSmartResponse;
}

export const OptimizerComparisonCard: React.FC<OptimizerComparisonCardProps> = ({ data }) => {
  const originalTokens = data.original.tokens;
  const optimizedTokens = data.selected.tokens;
  const tokensSaved = data.selected.tokens_saved;
  const savingsPercent = data.selected.savings_percent.toFixed(1);

  const baselineLatencyMs = data.baseline_latency_ms ?? null;
  const optimizedLatencyMs = data.optimized_latency_ms ?? data.metrics.total_latency_ms;
  const processingTimeMs = data.metrics.optimization_latency_ms;
  const llmResponseTimeS = (data.metrics.llm_latency_ms / 1000).toFixed(2);

  // Latency delta pill when baseline_latency_ms is provided by API
  let latencyDeltaPill: React.ReactNode = null;
  if (baselineLatencyMs != null) {
    if (optimizedLatencyMs <= baselineLatencyMs) {
      const diff = baselineLatencyMs - optimizedLatencyMs;
      latencyDeltaPill = (
        <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
          -{diff} ms faster
        </span>
      );
    } else {
      const diff = optimizedLatencyMs - baselineLatencyMs;
      latencyDeltaPill = (
        <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
          +{diff} ms overhead
        </span>
      );
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
      {/* Left Card: Without Optimizer (Baseline E0) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-xs font-semibold text-zinc-300">
              Without Optimizer (Baseline E0)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            Uncompressed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] text-zinc-400 block font-medium">Tokens Used</span>
            <div className="text-zinc-200 font-semibold text-lg font-mono mt-0.5">
              {originalTokens} tokens
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
              Raw user prompt
            </span>
          </div>

          <div>
            <span className="text-[11px] text-zinc-400 block font-medium">Total Latency</span>
            <div className="text-zinc-200 font-semibold text-lg font-mono mt-0.5">
              {baselineLatencyMs != null ? `${baselineLatencyMs} ms` : '—'}
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5 truncate" title={baselineLatencyMs != null ? 'Raw unoptimized LLM latency' : 'Awaiting baseline_latency_ms from API'}>
              {baselineLatencyMs != null
                ? 'Raw unoptimized LLM latency'
                : 'Awaiting baseline_latency_ms from API'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Card: With K-SMART Optimizer */}
      <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-[0_0_15px_rgba(99,102,241,0.08)]">
        <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-200">
              With K-SMART Optimizer
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
            {data.selected.strategy}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] text-zinc-400 block font-medium">Tokens Used</span>
            <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
              <span className="text-white font-semibold text-lg font-mono">
                {optimizedTokens} tokens
              </span>
              {tokensSaved > 0 && (
                <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  -{tokensSaved} tokens (-{savingsPercent}%)
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
              Optimal representation
            </span>
          </div>

          <div>
            <span className="text-[11px] text-zinc-400 block font-medium">Total Latency</span>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-white font-semibold text-lg font-mono">
                {optimizedLatencyMs} ms
              </span>
              {latencyDeltaPill}
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono truncate" title={`(${processingTimeMs} ms K-SMART + ${llmResponseTimeS}s LLM)`}>
              ({processingTimeMs} ms K-SMART + {llmResponseTimeS}s LLM)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
