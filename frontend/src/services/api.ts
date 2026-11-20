import axios from 'axios';
import { OptimizationMode, OptimizationResult, PromptPreset } from '../types';

export interface ChatResponse {
  prompt: string;
  response: string;
}

export const PRESETS: PromptPreset[] = [
  {
    id: 'verbose-travel',
    name: 'Verbose Travel',
    prompt: 'ದಯವಿಟ್ಟು ನನಗೆ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಭೇಟಿ ನೀಡಬಹುದಾದ 3 ಪ್ರಮುಖ ಪ್ರವಾಸಿ ಸ್ಥಳಗಳ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಮಾಹಿತಿ ನೀಡಿ. ತುಂಬಾ ಧನ್ಯವಾದಗಳು!',
    badge: 'E1 Redundancy Trim',
  },
  {
    id: 'polite-tech',
    name: 'Polite Tech',
    prompt: 'ನಮಸ್ಕಾರ, ನನಗೆ ಒಂದು ಸಹಾಯ ಬೇಕಿತ್ತು... ಪೈಥಾನ್ (Python) ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಭಾಷೆಯನ್ನು ಕಲಿಯಲು ಉತ್ತಮವಾದ 4 ಹಂತಗಳನ್ನು ದಯವಿಟ್ಟು ತಿಳಿಸಿಕೊಡಿ.',
    badge: 'E2 Morphological',
  },
  {
    id: 'short-fallback',
    name: 'Short Fallback',
    prompt: 'ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಯಾವುದು?',
    badge: 'E0 Passthrough',
  },
];

export async function optimizePrompt(
  prompt: string,
  mode: OptimizationMode,
  mockMode: boolean = true
): Promise<OptimizationResult> {
  if (mockMode) {
    // 1-second simulated delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const originalChars = prompt.length;
    let savingsPct = 32.4;
    let optimizedText = prompt;
    let eLevel = 'E1 (Adaptive Politeness & Honorific Compaction)';
    let explanation =
      'Removed conversational pleasantries, excessive honorifics, and normalized whitespace while retaining core intent.';

    if (prompt.includes('ದಯವಿಟ್ಟು') || prompt.includes('ಧನ್ಯವಾದಗಳು')) {
      eLevel = 'E1 (Honorific & Politeness Trimming)';
      optimizedText = prompt
        .replace(/ದಯವಿಟ್ಟು\s*/g, '')
        .replace(/ತುಂಬಾ ಧನ್ಯವಾದಗಳು!?/g, '')
        .replace(/ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಮಾಹಿತಿ ನೀಡಿ/g, 'ವಿವರ ತಿಳಿಸಿ')
        .trim();
      savingsPct = 36.8;
      explanation =
        'Trimmed boilerplate politeness markers ("ದಯವಿಟ್ಟು", "ತುಂಬಾ ಧನ್ಯವಾದಗಳು") and condensed descriptive requests ("ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಮಾಹಿತಿ ನೀಡಿ" → "ವಿವರ ತಿಳಿಸಿ").';
    } else if (prompt.includes('ನಮಸ್ಕಾರ') || prompt.includes('ಸಹಾಯ ಬೇಕಿತ್ತು')) {
      eLevel = 'E2 (Morphological Compaction & Syntactic Streamlining)';
      optimizedText = prompt
        .replace(/ನಮಸ್ಕಾರ,\s*/g, '')
        .replace(/ನನಗೆ ಒಂದು ಸಹಾಯ ಬೇಕಿತ್ತು\.\.\.\s*/g, '')
        .replace(/ದಯವಿಟ್ಟು ತಿಳಿಸಿಕೊಡಿ/g, 'ತಿಳಿಸಿ')
        .trim();
      savingsPct = 31.5;
      explanation =
        'Eliminated introductory greetings and filler prefixes ("ನಮಸ್ಕಾರ", "ಸಹಾಯ ಬೇಕಿತ್ತು..."), compressing compound verbal directives.';
    } else if (prompt.length < 35) {
      eLevel = 'E0 (Short Fallback Passthrough)';
      optimizedText = prompt;
      savingsPct = 0;
      explanation =
        'Query is concise (< 35 characters). Passthrough applied to prevent semantic loss or hallucination.';
    }

    const originalTokens = Math.max(1, Math.round(originalChars * 0.82));
    const optimizedChars = optimizedText.length;
    const optimizedTokens =
      savingsPct > 0 ? Math.max(1, Math.round(originalTokens * (1 - savingsPct / 100))) : originalTokens;

    return {
      originalPrompt: prompt,
      optimizedPrompt: optimizedText,
      mode,
      eLevel,
      originalCharacters: originalChars,
      optimizedCharacters: optimizedChars,
      originalTokens,
      optimizedTokens,
      tokenSavingsPercent: savingsPct,
      characterSavingsPercent:
        originalChars > 0 ? Math.round(((originalChars - optimizedChars) / originalChars) * 1000) / 10 : 0,
      estimatedLatencyMs: 128,
      explanation,
      response: `[Mock LLM Output] ಈ ಕೆಳಗಿನ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ: ${optimizedText}`,
    };
  }

  // Live backend call via axios
  try {
    const startTime = performance.now();
    const res = await axios.post<ChatResponse>('/api/v1/chat', { prompt });
    const endTime = performance.now();

    const originalChars = prompt.length;
    const optimizedChars = res.data.prompt.length;
    const originalTokens = Math.round(originalChars * 0.85);
    const optimizedTokens = Math.round(optimizedChars * 0.85);
    const charSavings =
      originalChars > 0 ? Math.round(((originalChars - optimizedChars) / originalChars) * 1000) / 10 : 0;

    return {
      originalPrompt: prompt,
      optimizedPrompt: res.data.prompt,
      mode,
      eLevel: 'E1 (Adaptive Backend Optimizer)',
      originalCharacters: originalChars,
      optimizedCharacters: optimizedChars,
      originalTokens,
      optimizedTokens,
      tokenSavingsPercent: Math.max(0, charSavings),
      characterSavingsPercent: Math.max(0, charSavings),
      estimatedLatencyMs: Math.round(endTime - startTime),
      explanation: 'Optimized via backend K-SMART pipeline.',
      response: res.data.response,
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
