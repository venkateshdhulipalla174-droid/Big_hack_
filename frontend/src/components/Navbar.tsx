import React from 'react';
import { Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  mockMode: boolean;
  onToggleMockMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  mockMode,
  onToggleMockMode,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Glowing Indigo Sparkles + Title + Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-100">
                K-SMART
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v0.1
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-normal hidden sm:block">
              Adaptive Kannada Prompt Optimizer
            </span>
          </div>
        </div>

        {/* Center: Pill Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-full shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange('playground')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeTab === 'playground'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Playground
          </button>
          <button
            type="button"
            onClick={() => onTabChange('benchmark')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeTab === 'benchmark'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Benchmark Comparison
          </button>
        </div>

        {/* Right: Mock Mode Toggle Switch with Emerald Status Dot */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={mockMode}
            onClick={onToggleMockMode}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              mockMode
                ? 'bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:border-zinc-600'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            {/* Status dot */}
            <span className="relative flex h-2 w-2">
              {mockMode ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
              )}
            </span>

            <span>Mock Mode</span>

            {/* Visual switch slider */}
            <div
              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                mockMode ? 'bg-emerald-500/30 border border-emerald-500/50' : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${
                  mockMode ? 'translate-x-3 bg-emerald-400' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
