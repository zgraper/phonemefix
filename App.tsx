import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { RuleSettings } from './components/RuleSettings';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RuleConfig, PipelineResponse, ProcessingStatus } from './types';
import { DEFAULT_RULES } from './constants';
import { runPipeline } from './services/api';
import { Mic, Play, RefreshCw, Activity, Key } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rules, setRules] = useState<RuleConfig>(DEFAULT_RULES);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flattenRules = (rules) => {
    return {
      gliding: rules.gliding.selectAll,
      stopping: rules.stopping.selectAll,
      cluster_reduction: rules.cluster_reduction.selectAll ?? rules.cluster_reduction.active ?? false,
      final_consonant_deletion: rules.final_consonant_deletion.selectAll ?? rules.final_consonant_deletion.active ?? false
    };
  };

  const handleRuleChange = useCallback((key: keyof RuleConfig, value: boolean) => {
    setRules(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleProcess = async () => {
    if (!file) return;

    setStatus(ProcessingStatus.UPLOADING);
    setError(null);
    setResult(null);

    try {
      // --- Flatten the rule model ---
      const data = await runPipeline({
        audioFile: file,
        rules: flattenRules(rules)
      });

      setResult(data);
      setStatus(ProcessingStatus.COMPLETE);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const resetApp = () => {
    setFile(null);
    setResult(null);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
  };

  const isLoading = [
    ProcessingStatus.UPLOADING, 
    ProcessingStatus.PHONEMIZING, 
    ProcessingStatus.CORRECTING, 
    ProcessingStatus.DECODING
  ].includes(status);

  const handleToggleSubrule = (category, subrule, active) => {
    setRules(prev => {
      const updated = { ...prev };

      updated[category].subrules[subrule].active = active;

      // Recompute selectAll
      const allActive = Object.values(updated[category].subrules)
        .every(s => s.active);

      updated[category].selectAll = allActive;

      return updated;
    });
  };

  const handleToggleSelectAll = (category) => {
    setRules(prev => {
      const updated = { ...prev };
      const newState = !updated[category].selectAll;

      Object.values(updated[category].subrules).forEach(
        s => (s.active = newState)
      );

      updated[category].selectAll = newState;

      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Mic size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">PhonemeFix</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Child Speech Correction & Translation Research</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            v1.0.0-beta
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Input Audio
              </h2>
              <FileUpload 
                onFileSelect={setFile} 
                selectedFile={file} 
                disabled={isLoading} 
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Configuration
              </h2>
              <RuleSettings 
                rules={rules} 
                onToggleSubrule={handleToggleSubrule}
                onToggleSelectAll={handleToggleSelectAll}
                disabled={isLoading} 
              />
            </section>

            <button
              onClick={handleProcess}
              disabled={!file || isLoading}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white shadow-md transition-all duration-200
                flex items-center justify-center space-x-2
                ${!file || isLoading 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'}
              `}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  <span>Run Pipeline</span>
                </>
              )}
            </button>
            
            {/* Status Text */}
            {isLoading && (
              <div className="text-center">
                <p className="text-sm font-medium text-indigo-600 animate-pulse">
                  {status === ProcessingStatus.UPLOADING && "Uploading audio..."}
                  {status === ProcessingStatus.PHONEMIZING && "Running Wav2Vec2 extraction..."}
                  {status === ProcessingStatus.CORRECTING && "Applying phonological rules..."}
                  {status === ProcessingStatus.DECODING && "Decoding text..."}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
             <section className="h-full">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                   <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                   Output
                 </h2>
                 {result && (
                   <button 
                     onClick={resetApp}
                     className="text-sm text-slate-500 hover:text-indigo-600 flex items-center space-x-1"
                   >
                     <RefreshCw size={14} />
                     <span>Reset</span>
                   </button>
                 )}
               </div>
               
               {result ? (
                 <ResultsDisplay results={result} />
               ) : (
                 <div className="h-96 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                     <Activity size={32} className="text-slate-300" />
                   </div>
                   <p className="text-lg font-medium">No results yet</p>
                   <p className="text-sm">Upload audio and run the pipeline to see analysis.</p>
                 </div>
               )}
             </section>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;