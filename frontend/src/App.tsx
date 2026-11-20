import React, { useState } from 'react';
import { TabType, OptimizationMode } from './types';
import { KSmartResponse } from './types/ksmart';
import { getMockKSmartResponse } from './data/mockResponses';
import { Navbar } from './components/Navbar';
import { PromptStudio } from './components/PromptStudio';
import { PipelineStepper } from './components/PipelineStepper';
import { AchievementMetrics } from './components/AchievementMetrics';
import { ResponseCard } from './components/ResponseCard';
import { BenchmarkPlaceholder } from './components/BenchmarkPlaceholder';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('playground');
  const [mockMode, setMockMode] = useState<boolean>(true);

  // Step 2 Pipeline & Optimization State
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ksmartResponse, setKsmartResponse] = useState<KSmartResponse | null>(null);

  const handleOptimizeAndRun = async (promptText: string, _mode: OptimizationMode) => {
    setIsRunning(true);
    setActiveStep(1); // Step 1: Unicode Normalize

    // Animate activeStep from 1 to 4 over ~1.2 seconds (300ms per step)
    await new Promise((r) => setTimeout(r, 300));
    setActiveStep(2); // Step 2: Generate 5 Candidates

    await new Promise((r) => setTimeout(r, 300));
    setActiveStep(3); // Step 3: Meaning Guard & Tokenize

    await new Promise((r) => setTimeout(r, 300));
    setActiveStep(4); // Step 4: Gemini API Response

    await new Promise((r) => setTimeout(r, 300));

    // Finish pipeline and load response data
    const responseData = getMockKSmartResponse(promptText);
    setKsmartResponse(responseData);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mockMode={mockMode}
        onToggleMockMode={() => setMockMode((prev) => !prev)}
      />

      {/* Main Workspace (max-w-6xl centered) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Subtle Ambient Background Glow */}
        <div className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/10 blur-[90px] pointer-events-none rounded-full" />
        </div>

        {/* Tab Content */}
        {activeTab === 'playground' ? (
          <div className="space-y-6">
            {/* Step 1 UI: Kannada Prompt Studio */}
            <PromptStudio
              mockMode={mockMode}
              isRunning={isRunning}
              onOptimize={handleOptimizeAndRun}
              ksmartResponse={ksmartResponse}
            />

            {/* Step 2 UI: Pipeline Progress Stepper */}
            {(activeStep > 0 || isRunning || ksmartResponse) && (
              <div className="animate-in fade-in duration-300">
                <PipelineStepper activeStep={activeStep} isRunning={isRunning} />
              </div>
            )}

            {/* Step 2 UI: Achievement Metrics & Gemini Response Card */}
            {ksmartResponse && !isRunning && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <AchievementMetrics data={ksmartResponse} />
                <ResponseCard
                  response={ksmartResponse.llm_response}
                  outputTokens={ksmartResponse.metrics.output_tokens}
                />
              </div>
            )}
          </div>
        ) : (
          <BenchmarkPlaceholder />
        )}
      </main>

      {/* Sleek Minimal Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950/90 py-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            K-SMART: Kannada Semantic-preserving Minimization &amp; Adaptive Representation Technique
          </span>
          <span className="text-zinc-600">Research &amp; Hackathon Prototype</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
