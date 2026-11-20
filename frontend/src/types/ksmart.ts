export interface Candidate {
  strategy: string;
  text: string;
  tokens: number;
  similarity: number;
  passed_guard: boolean;
}

export interface KSmartResponse {
  original: {
    text: string;
    tokens: number;
  };
  selected: {
    strategy: string;
    text: string;
    tokens: number;
    similarity_score: number;
    tokens_saved: number;
    savings_percent: number;
  };
  candidates: Candidate[];
  llm_response: string;
  metrics: {
    optimization_latency_ms: number;
    llm_latency_ms: number;
    total_latency_ms: number;
    output_tokens: number;
  };
  baseline_latency_ms?: number | null;
  optimized_latency_ms?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ksmartData?: KSmartResponse;
  mode?: string;
}

export interface BenchmarkDataPoint {
  id: string;
  name: string;
  approach: string;
  tokens: number;
  savings: string;
  latency: number;
  similarity: string;
  verdict: string;
  verdictType?: 'baseline' | 'neutral' | 'best' | 'warning';
  barColor?: string;
  description?: string;
}

/**
 * Maps raw backend strategy keys cleanly to human-readable names.
 */
export function formatStrategyName(strategy: string): string {
  const s = (strategy || '').toLowerCase().trim();
  if (s.includes('original')) return 'Original';
  if (s.includes('normalized')) return 'Normalized';
  if (s.includes('concise')) return 'Concise';
  if (s.includes('structured')) return 'Structured';
  if (s.includes('english') || s.includes('trans')) return 'Translated';
  return strategy.charAt(0).toUpperCase() + strategy.slice(1).replace(/_/g, ' ');
}
