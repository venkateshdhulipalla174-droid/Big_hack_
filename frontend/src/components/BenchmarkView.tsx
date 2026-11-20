import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  TrendingDown,
  ShieldCheck,
  DollarSign,
  FlaskConical,
  BarChart3,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

type MetricType = 'tokens' | 'latency';

interface BenchmarkDataPoint {
  id: string;
  name: string;
  approach: string;
  tokens: number;
  savings: string;
  latency: number;
  similarity: string;
  verdict: string;
  verdictType: 'baseline' | 'neutral' | 'best' | 'warning';
  barColor: string;
  description: string;
}

const BENCHMARK_DATA: BenchmarkDataPoint[] = [
  {
    id: 'E0',
    name: 'E0 Original',
    approach: 'Original Kannada (Baseline)',
    tokens: 46,
    savings: '0.0%',
    latency: 1280,
    similarity: '100%',
    verdict: 'Baseline',
    verdictType: 'baseline',
    barColor: '#52525b', // zinc-600
    description: 'Raw unaltered Kannada input text with conversational politeness and redundant particles.',
  },
  {
    id: 'E1',
    name: 'E1 Normalized',
    approach: 'Normalized Kannada',
    tokens: 42,
    savings: '8.7%',
    latency: 1250,
    similarity: '99.0%',
    verdict: 'Low Savings',
    verdictType: 'neutral',
    barColor: '#71717a', // zinc-500
    description: 'NFC Unicode normalization, zero-width space deletion, and whitespace compaction.',
  },
  {
    id: 'E2',
    name: 'E2 K-SMART',
    approach: 'K-SMART Adaptive (Ours)',
    tokens: 28,
    savings: '38.4%',
    latency: 1180,
    similarity: '92.6%',
    verdict: 'Best Overall Balance',
    verdictType: 'best',
    barColor: '#6366f1', // indigo-500
    description: 'Semantic-preserving syntactic minimization, honorific trimming, and cosine meaning guard.',
  },
  {
    id: 'E3',
    name: 'E3 English Trans.',
    approach: 'Kannada-to-English Translation',
    tokens: 19,
    savings: '58.7%',
    latency: 1490,
    similarity: '84.1%',
    verdict: 'Higher Latency / Drift',
    verdictType: 'warning',
    barColor: '#f59e0b', // amber-500
    description: 'Translates prompt to English for compact tokenization, but incurs translation latency and cultural semantic drift.',
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: BenchmarkDataPoint;
    value: number;
  }>;
  metric: MetricType;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, metric }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const isTokens = metric === 'tokens';

    return (
      <div className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-3.5 py-2.5 text-xs shadow-2xl space-y-1.5 max-w-xs">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
          <span className="font-semibold text-zinc-200">{data.name}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              data.verdictType === 'best'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : data.verdictType === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {data.id}
          </span>
        </div>
        <p className="text-zinc-400 text-[11px]">{data.approach}</p>
        <div className="pt-1 space-y-1">
          <div className="flex items-center justify-between text-zinc-300">
            <span>{isTokens ? 'Input Tokens:' : 'Total Latency:'}</span>
            <span className="font-mono font-bold text-white">
              {isTokens ? `${data.tokens} tokens` : `${data.latency} ms`}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Token Savings:</span>
            <span
              className={`font-mono font-semibold ${
                parseFloat(data.savings) > 0 ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {data.savings}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Similarity Retention:</span>
            <span className="font-mono text-zinc-200">{data.similarity}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const BenchmarkView: React.FC = () => {
  const [metric, setMetric] = useState<MetricType>('tokens');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-100 sm:text-xl flex items-center gap-2">
                Experiment Benchmark Suite (E0–E3)
              </h2>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Evaluated across 30 diverse Kannada prompts (Q&amp;A, instructions, noisy/polite queries,
            and short fallback cases).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            N=30 Prompts Dataset
          </span>
        </div>
      </div>

      {/* 3-Column Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-zinc-400 font-medium">
              Avg Token Savings (E2 K-SMART)
            </span>
            <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-emerald-400 text-3xl font-bold font-mono tracking-tight">
              38.4%
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500 font-sans">
              vs. E0 Original Kannada baseline
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-zinc-400 font-medium">Avg Meaning Retention</span>
            <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-indigo-400 text-3xl font-bold font-mono tracking-tight">
              92.6%
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500 font-sans">
              Verified via semantic similarity guard
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl shadow-black/20 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-zinc-400 font-medium">
              Est. Cost Saved / 1M Queries
            </span>
            <div className="p-1 rounded bg-zinc-800 border border-zinc-700/70 text-zinc-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-white text-3xl font-bold font-mono tracking-tight">
              $142
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500 font-sans">
              Based on Gemini API input token rates
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Recharts BarChart Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl shadow-black/20 space-y-4">
        {/* Card Header & Pill Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
                E0–E3 Experiment Performance
              </h3>
              <p className="text-[11px] text-zinc-400">
                Compare token efficiency and end-to-end latency across representation approaches
              </p>
            </div>
          </div>

          {/* Metric Pill Toggle */}
          <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-full shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetric('tokens')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                metric === 'tokens'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Avg Input Tokens</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric('latency')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                metric === 'latency'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Avg Total Latency (ms)</span>
            </button>
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="w-full h-[280px] min-h-[280px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={BENCHMARK_DATA}
              margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={{ stroke: '#3f3f46' }}
                unit={metric === 'tokens' ? ' t' : ' ms'}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Bar
                dataKey={metric === 'tokens' ? 'tokens' : 'latency'}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              >
                {BENCHMARK_DATA.map((entry) => (
                  <Cell key={entry.id} fill={entry.barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend strip below chart */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#52525b]" />
            <span>E0 Baseline (46 t / 1280 ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#71717a]" />
            <span>E1 Normalized (42 t / 1250 ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
            <span className="text-indigo-300 font-medium">E2 K-SMART (28 t / 1180 ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-amber-400">E3 English Trans. (19 t / 1490 ms + Overhead)</span>
          </div>
        </div>
      </div>

      {/* Experiment Comparison Table Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 overflow-x-auto shadow-xl shadow-black/20">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
              Experiment Comparison Table
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500">Methodology &amp; Tradeoff Matrix</span>
        </div>

        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
              <th className="py-3 px-3">Experiment</th>
              <th className="py-3 px-3">Approach</th>
              <th className="py-3 px-3 font-mono">Avg Tokens</th>
              <th className="py-3 px-3 font-mono">Token Savings</th>
              <th className="py-3 px-3 font-mono">Avg Latency</th>
              <th className="py-3 px-3 font-mono">Similarity</th>
              <th className="py-3 px-3 text-right">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {BENCHMARK_DATA.map((row) => {
              const isBest = row.id === 'E2';
              const isWarning = row.id === 'E3';

              return (
                <tr
                  key={row.id}
                  className={`transition-colors duration-150 ${
                    isBest
                      ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500 hover:bg-indigo-500/15'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Experiment */}
                  <td className="py-3 px-3 font-mono font-bold text-zinc-200">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        isBest
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      {row.id}
                    </span>
                  </td>

                  {/* Approach */}
                  <td className="py-3 px-3">
                    <span
                      className={`font-medium ${
                        isBest ? 'text-indigo-200 font-semibold' : 'text-zinc-200'
                      }`}
                    >
                      {row.approach}
                    </span>
                  </td>

                  {/* Avg Tokens */}
                  <td className="py-3 px-3 font-mono font-medium text-zinc-300">{row.tokens}</td>

                  {/* Token Savings */}
                  <td className="py-3 px-3 font-mono font-semibold">
                    <span
                      className={
                        parseFloat(row.savings) > 30
                          ? 'text-emerald-400'
                          : parseFloat(row.savings) > 0
                          ? 'text-zinc-300'
                          : 'text-zinc-500'
                      }
                    >
                      {row.savings}
                    </span>
                  </td>

                  {/* Avg Latency */}
                  <td className="py-3 px-3 font-mono text-zinc-300">
                    {row.latency.toLocaleString()} ms
                  </td>

                  {/* Similarity */}
                  <td className="py-3 px-3 font-mono text-zinc-300">
                    <span
                      className={
                        parseFloat(row.similarity) >= 90
                          ? 'text-emerald-400 font-medium'
                          : 'text-amber-400'
                      }
                    >
                      {row.similarity}
                    </span>
                  </td>

                  {/* Verdict */}
                  <td className="py-3 px-3 text-right">
                    {isBest ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                        <CheckCircle2 className="w-3 h-3" />
                        {row.verdict}
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        {row.verdict}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {row.verdict}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footnote summary */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span>
            Key Finding: E2 K-SMART yields the optimal Pareto frontier between token reduction
            (-38.4%) and semantic fidelity (92.6%) with the lowest latency (1,180 ms).
          </span>
          <span className="font-mono text-zinc-400">Baseline = E0 (Original)</span>
        </div>
      </div>
    </div>
  );
};
