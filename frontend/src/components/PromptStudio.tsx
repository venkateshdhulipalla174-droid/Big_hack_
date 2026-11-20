import React, { useState, useRef } from 'react';
import { X, Loader2, Zap } from 'lucide-react';
import { OptimizationMode } from '../types';
import { PRESETS } from '../services/api';

interface PromptStudioProps {
  mockMode: boolean;
  isRunning?: boolean;
  onOptimize?: (prompt: string, mode: OptimizationMode) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  mockMode: _mockMode,
  isRunning = false,
  onOptimize,
}) => {
  // Preset 1 is pre-filled by default
  const [prompt, setPrompt] = useState<string>(PRESETS[0].prompt);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [mode, setMode] = useState<OptimizationMode>('adaptive');
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePresetClick = (presetId: string, text: string) => {
    setSelectedPresetId(presetId);
    setPrompt(text);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClear = () => {
    setPrompt('');
    setSelectedPresetId('');
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleOptimizeAndRun = () => {
    if (!prompt.trim()) {
      setError('ದಯವಿಟ್ಟು ಪ್ರಾಂಪ್ಟ್ ನಮೂದಿಸಿ (Please enter a prompt to optimize)');
      return;
    }

    setError(null);

    if (onOptimize) {
      onOptimize(prompt, mode);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kannada Prompt Studio Main Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xl shadow-black/30 backdrop-blur-sm transition-all duration-200">
        {/* Header: Label & 3 Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-200">
              Kannada Prompt <span className="text-zinc-400 font-normal">(ಕನ್ನಡ ಪ್ರಾಂಪ್ಟ್)</span>
            </h2>
          </div>

          {/* 3 Clickable Preset Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 mr-1 hidden md:inline">Presets:</span>
            {PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id && prompt === preset.prompt;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset.id, preset.prompt)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500/70 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)] font-medium'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <span>{preset.name}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea Container with Clear (X) Button */}
        <div className="relative mt-4">
          <textarea
            ref={textareaRef}
            rows={4}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              const matched = PRESETS.find((p) => p.prompt === e.target.value);
              setSelectedPresetId(matched ? matched.id : '');
            }}
            placeholder="ಕನ್ನಡದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್ ಅನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೇಲಿನ ಪೂರ್ವನಿಗದಿಗಳನ್ನು ಆರಿಸಿ..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 pr-10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans text-sm md:text-base leading-relaxed resize-y min-h-[110px]"
          />

          {/* Subtle Clear (X) Button */}
          {prompt.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear prompt text"
              title="Clear text"
              className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error notice if prompt empty */}
        {error && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-md px-3 py-1.5">
            {error}
          </div>
        )}

        {/* Bottom Bar: Character Count + Mode Dropdown on Left, Indigo Button on Right */}
        <div className="mt-4 pt-3 border-t border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Live Character Count + Mode Dropdown */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="font-mono text-zinc-300 font-medium">{prompt.length}</span>
              <span>characters</span>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <label htmlFor="mode-select" className="text-zinc-400 whitespace-nowrap">
                Mode:
              </label>
              <select
                id="mode-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as OptimizationMode)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="adaptive">Adaptive Selection</option>
                <option value="compare_all">Compare All E0–E3</option>
              </select>
            </div>
          </div>

          {/* Right: Primary Indigo Optimize & Run Button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleOptimizeAndRun}
              disabled={isRunning}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold tracking-wide transition-all duration-200 shadow-md ${
                isRunning
                  ? 'bg-indigo-700 text-indigo-100 cursor-not-allowed opacity-90'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-600/25 hover:shadow-indigo-500/35'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-indigo-200 fill-indigo-200" />
                  <span>Optimize &amp; Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
