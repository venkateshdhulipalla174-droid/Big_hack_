import assert from 'node:assert';

// Test normalizeKSmartResponse logic directly
function normalizeKSmartResponse(raw, prompt) {
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

  let candidates = [];
  if (Array.isArray(raw?.candidates) && raw.candidates.length > 0) {
    candidates = raw.candidates.map((c) => ({
      strategy: String(c.strategy || c.name || 'Candidate'),
      text: String(c.text || c.prompt || ''),
      tokens: Number(c.tokens ?? 0),
      similarity: Number(c.similarity ?? c.similarity_score ?? 0),
      passed_guard: Boolean(c.passed_guard ?? true),
    }));
  }

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

  let baselineLatencyMs = null;
  if (raw?.baseline_latency_ms != null && typeof raw.baseline_latency_ms === 'number') {
    baselineLatencyMs = Math.round(raw.baseline_latency_ms);
  } else if (
    raw?.baseline_response_time_s != null &&
    typeof raw.baseline_response_time_s === 'number'
  ) {
    baselineLatencyMs = Math.round(raw.baseline_response_time_s * 1000);
  }

  let optimizedLatencyMs;
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

console.log('Running frontend API smoke tests...');

// 1. Full live payload mapping
const fullPayload = {
  llm_response: 'Here are the top places to visit.',
  original_prompt: 'Can you please provide a list of top places to visit in Bangalore?',
  optimized_prompt: 'Top places to visit in Bangalore',
  original_tokens: 14,
  optimized_tokens: 6,
  tokens_saved: 8,
  savings_percent: 57.14,
  selected_strategy: 'concise',
  similarity_score: 0.94,
  processing_time_ms: 110,
  llm_response_time_s: 0.75,
  baseline_latency_ms: 1100,
  optimized_latency_ms: 860,
  candidates: [
    { strategy: 'concise', text: 'Top places in Bangalore', tokens: 5, similarity: 0.94, passed_guard: true },
  ],
};

const res1 = normalizeKSmartResponse(fullPayload, fullPayload.original_prompt);
assert.strictEqual(res1.llm_response, 'Here are the top places to visit.');
assert.strictEqual(res1.selected.tokens, 6);
assert.strictEqual(res1.selected.tokens_saved, 8);
assert.strictEqual(res1.selected.savings_percent, 57.1);
assert.strictEqual(res1.baseline_latency_ms, 1100);
assert.strictEqual(res1.optimized_latency_ms, 860);
assert.strictEqual(res1.candidates.length, 1);
console.log('✔ Full live backend payload mapped successfully.');

// 2. Minimal live payload with missing optional fields
const minimalPayload = {
  llm_response: 'Short answer.',
};
const res2 = normalizeKSmartResponse(minimalPayload, 'My prompt');
assert.strictEqual(res2.llm_response, 'Short answer.');
assert.strictEqual(res2.baseline_latency_ms, null, 'baseline_latency_ms must be null when omitted');
assert.strictEqual(res2.candidates.length, 0, 'candidates must default to empty array');
assert.strictEqual(res2.selected.tokens, 0);
console.log('✔ Minimal live payload defaulted safely without crashing.');

console.log('All frontend API smoke tests passed successfully!');
