import axios from 'axios';
import { KSmartResponse, Candidate, BenchmarkDataPoint } from '../types/ksmart';

const FALLBACK_API_URL = 'http://localhost:8000';
const DEFAULT_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  FALLBACK_API_URL;

/**
 * Validates that a given URL strictly starts with http:// or https://, falling back to default/localhost otherwise.
 */
function sanitizeBaseUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return DEFAULT_API_URL;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return FALLBACK_API_URL;
}

/**
 * Returns the currently active FastAPI backend base URL from localStorage, falling back to env/default.
 * Enforces http:// or https:// schemes.
 */
export function getApiBaseUrl(): string {
  try {
    const stored = localStorage.getItem('ksmart_api_url');
    return sanitizeBaseUrl(stored || DEFAULT_API_URL);
  } catch {
    return sanitizeBaseUrl(DEFAULT_API_URL);
  }
}

/**
 * Updates the active FastAPI backend base URL in localStorage and configures apiClient defaults.
 * Validates that the configured URL starts with http:// or https://, falling back to "http://localhost:8000" otherwise.
 */
export function setApiBaseUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) {
      localStorage.setItem('ksmart_api_url', trimmed);
      apiClient.defaults.baseURL = trimmed;
    } else {
      localStorage.removeItem('ksmart_api_url');
      apiClient.defaults.baseURL = FALLBACK_API_URL;
    }
  } catch {
    apiClient.defaults.baseURL = FALLBACK_API_URL;
  }
}

// Configure Axios with dynamic baseURL and 30s timeout
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor ensures requests always use the latest configured base URL
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

/**
 * Checks backend health by querying /health, falling back to / with a 3000ms timeout.
 * Returns true on any 2xx response, false on error or timeout.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const currentBase = getApiBaseUrl();
  try {
    const res = await apiClient.get('/health', { timeout: 3000, baseURL: currentBase });
    return res.status >= 200 && res.status < 300;
  } catch {
    try {
      const fallbackRes = await apiClient.get('/', { timeout: 3000, baseURL: currentBase });
      return fallbackRes.status >= 200 && fallbackRes.status < 300;
    } catch {
      return false;
    }
  }
}

/**
 * Safely normalizes arbitrary live responses from the FastAPI backend to prevent runtime errors.
 * Never fabricates mock candidates or fake latency metrics.
 */
export function normalizeKSmartResponse(raw: any, prompt: string): KSmartResponse {
  const originalText = String(
    raw?.original_prompt || raw?.original?.text || raw?.original?.prompt || prompt
  );
  const originalTokens = Number(
    raw?.original_tokens ?? raw?.original?.tokens ?? 0
  );

  const selectedText = String(
    raw?.optimized_prompt || raw?.selected?.text || raw?.selected_text || originalText
  );
  const selectedTokens = Number(
    raw?.optimized_tokens ?? raw?.selected?.tokens ?? 0
  );
  const tokensSaved = Number(
    raw?.tokens_saved ?? raw?.selected?.tokens_saved ?? Math.max(0, originalTokens - selectedTokens)
  );
  const savingsPercent = Number(
    raw?.savings_percent ??
      raw?.selected?.savings_percent ??
      (originalTokens > 0 ? (tokensSaved / originalTokens) * 100 : 0)
  );
  const strategy = String(
    raw?.selected_strategy || raw?.selected?.strategy || raw?.strategy || 'concise'
  );
  const similarityScore =
    raw?.similarity_score != null
      ? Number(raw.similarity_score)
      : raw?.selected?.similarity_score != null
      ? Number(raw.selected.similarity_score)
      : 0;

  // Map only real candidates from the backend; default safely to [] if omitted
  let candidates: Candidate[] = [];
  if (Array.isArray(raw?.candidates) && raw.candidates.length > 0) {
    candidates = raw.candidates.map((c: any) => ({
      strategy: String(c.strategy || c.name || 'Candidate'),
      text: String(c.text || c.prompt || ''),
      tokens: Number(c.tokens ?? 0),
      similarity: Number(c.similarity ?? c.similarity_score ?? 0),
      passed_guard: Boolean(c.passed_guard ?? true),
    }));
  }

  // Processing & LLM Latency
  const processingTimeMs = Number(
    raw?.processing_time_ms ?? raw?.metrics?.optimization_latency_ms ?? 0
  );
  const llmResponseTimeS = Number(
    raw?.llm_response_time_s ??
      (raw?.metrics?.llm_latency_ms ? raw.metrics.llm_latency_ms / 1000 : 0)
  );
  const llmLatencyMs = Math.round(llmResponseTimeS * 1000);
  const totalLatencyMs = Number(
    raw?.metrics?.total_latency_ms ?? processingTimeMs + llmLatencyMs
  );
  const outputTokens = Number(raw?.metrics?.output_tokens ?? 0);

  // Baseline latency: strictly from backend, or null if missing (never fabricate fake numbers)
  let baselineLatencyMs: number | null = null;
  if (raw?.baseline_latency_ms != null && typeof raw.baseline_latency_ms === 'number') {
    baselineLatencyMs = Math.round(raw.baseline_latency_ms);
  } else if (
    raw?.baseline_response_time_s != null &&
    typeof raw.baseline_response_time_s === 'number'
  ) {
    baselineLatencyMs = Math.round(raw.baseline_response_time_s * 1000);
  }

  // Optimized latency
  let optimizedLatencyMs: number;
  if (raw?.optimized_latency_ms != null && typeof raw.optimized_latency_ms === 'number') {
    optimizedLatencyMs = Math.round(raw.optimized_latency_ms);
  } else if (processingTimeMs > 0 || llmResponseTimeS > 0) {
    optimizedLatencyMs = Math.round(processingTimeMs + llmLatencyMs);
  } else {
    optimizedLatencyMs = totalLatencyMs;
  }

  return {
    original: {
      text: originalText,
      tokens: originalTokens,
    },
    selected: {
      strategy,
      text: selectedText,
      tokens: selectedTokens,
      similarity_score: similarityScore,
      tokens_saved: tokensSaved,
      savings_percent: Number(savingsPercent.toFixed(1)),
    },
    candidates,
    llm_response: String(
      raw?.llm_response || raw?.response || raw?.output || 'No response returned from backend.'
    ),
    metrics: {
      optimization_latency_ms: processingTimeMs,
      llm_latency_ms: llmLatencyMs,
      total_latency_ms: optimizedLatencyMs,
      output_tokens: outputTokens,
    },
    baseline_latency_ms: baselineLatencyMs,
    optimized_latency_ms: optimizedLatencyMs,
  };
}

/**
 * Optimizes the prompt and runs inference directly via live FastAPI backend.
 * Calls POST /api/optimize-and-run on the configured base URL.
 */
export async function optimizeAndRun(
  prompt: string,
  mode: string = 'adaptive'
): Promise<KSmartResponse> {
  const response = await apiClient.post<any>(
    '/api/optimize-and-run',
    {
      prompt,
      mode,
    },
    {
      baseURL: getApiBaseUrl(),
    }
  );

  return normalizeKSmartResponse(response.data, prompt);
}

/**
 * Fetches real benchmark results from the backend via GET /api/benchmarks.
 * Returns null if the endpoint is unavailable or empty.
 */
export async function fetchBenchmarks(): Promise<BenchmarkDataPoint[] | null> {
  try {
    const response = await apiClient.get<any>('/api/benchmarks', {
      baseURL: getApiBaseUrl(),
      timeout: 5000,
    });
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data.map((item: any, idx: number) => ({
        id: item.id || `E${idx}`,
        name: item.name || item.id || `E${idx}`,
        approach: item.approach || item.strategy || 'Evaluated Approach',
        tokens: Number(item.tokens || item.avg_tokens || 0),
        savings: String(item.savings || item.token_savings || '0.0%'),
        latency: Number(item.latency || item.avg_latency_ms || 0),
        similarity: String(item.similarity || '100%'),
        verdict: String(item.verdict || 'Evaluated'),
        verdictType:
          item.verdictType ||
          (item.id === 'E2' ? 'best' : item.id === 'E0' ? 'baseline' : 'neutral'),
        barColor:
          item.barColor ||
          (item.id === 'E2' ? '#6366f1' : item.id === 'E0' ? '#52525b' : '#71717a'),
        description: item.description || '',
      }));
    }
    return null;
  } catch {
    return null;
  }
}
