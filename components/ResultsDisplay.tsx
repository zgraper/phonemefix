import React from 'react';
import { PipelineResponse } from '../types';
import { ArrowRight, Type, Activity, CheckCircle2 } from 'lucide-react';

interface ResultsDisplayProps {
  results: PipelineResponse | null;
}

const ResultCard: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  content: string; 
  isMono?: boolean;
  colorClass: string; 
}> = ({ title, icon, content, isMono, colorClass }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
    <div className={`px-4 py-3 border-b border-slate-100 ${colorClass} bg-opacity-5 flex items-center space-x-2`}>
      <div className={colorClass}>{icon}</div>
      <span className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{title}</span>
    </div>
    <div className={`p-4 flex-grow ${isMono ? 'font-mono text-sm' : 'text-base'} text-slate-700 bg-slate-50/50`}>
      {content}
    </div>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          Analysis Complete
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Pipeline Visualization */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          
          {/* Step 1: Raw IPA */}
          <div className="flex-1">
            <ResultCard 
              title="Raw IPA (Wav2Vec2)" 
              icon={<Activity size={16} />}
              content={results.raw_ipa}
              isMono={true}
              colorClass="text-blue-600"
            />
          </div>

          {/* Arrow Connector */}
          <div className="hidden md:flex items-center justify-center text-slate-300">
            <ArrowRight size={24} />
          </div>

          {/* Step 2: Corrected IPA */}
          <div className="flex-1">
            <ResultCard 
              title="Corrected IPA" 
              icon={<CheckCircle2 size={16} />}
              content={results.corrected_ipa}
              isMono={true}
              colorClass="text-purple-600"
            />
          </div>

           {/* Arrow Connector */}
           <div className="hidden md:flex items-center justify-center text-slate-300">
            <ArrowRight size={24} />
          </div>

          {/* Step 3: Decoded Text */}
          <div className="flex-1">
             <ResultCard 
              title="Decoded Text (T5)" 
              icon={<Type size={16} />}
              content={results.final_text}
              isMono={false}
              colorClass="text-emerald-600"
            />
          </div>

        </div>
      </div>

      {/* Details Section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-3">Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-100 p-3 rounded-lg">
            <span className="text-slate-500 block text-xs mb-1">Acoustic Model</span>
            <span className="font-mono text-slate-700">{results.wav2vec2_model_used || 'Unknown'}</span>
          </div>
          <div className="bg-slate-100 p-3 rounded-lg">
            <span className="text-slate-500 block text-xs mb-1">Active Rules</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(results.rules_applied).map(([key, val]) => (
                val && (
                  <span key={key} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                    {key.replace(/_/g, ' ')}
                  </span>
                )
              ))}
              {!Object.values(results.rules_applied).some(Boolean) && <span className="text-slate-400 italic">None</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};