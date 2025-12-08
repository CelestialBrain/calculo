import React, { useState } from 'react';
import { Eye, EyeOff, Code, Activity, BrainCircuit, Sigma } from 'lucide-react';
import { MathProblemState } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ProblemDisplayProps {
  data: MathProblemState;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ data }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [showPython, setShowPython] = useState(false);

  // Attempt to extract the final answer for the "Boxed" UI
  const extractFinalAnswer = (text: string | null) => {
    if (!text) return null;
    const match = text.match(/\\boxed\{([^}]+)\}/);
    return match ? match[1] : null;
  };

  const finalAnswer = extractFinalAnswer(data.solution);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Problem Section - Textbook Card Style */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#007AFF]"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-[#007AFF]">
                <BrainCircuit size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Generated Problem</h2>
        </div>
        
        {data.problem && <MarkdownRenderer content={data.problem} />}
      </div>

      {/* Difficulty Analysis - Subtle Note Style */}
      {data.difficultyAnalysis && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex gap-4">
           <div className="shrink-0 mt-1">
                <Activity size={18} className="text-purple-600" />
           </div>
           <div>
               <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-2">Difficulty Analysis</h3>
               <div className="text-sm text-slate-600">
                    <MarkdownRenderer content={data.difficultyAnalysis} />
               </div>
           </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#007AFF] hover:bg-[#005ecb] text-white font-medium text-sm transition-all shadow-sm active:scale-95"
        >
          {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
          {showSolution ? "Hide Solution" : "Reveal Step-by-Step Solution"}
        </button>

        {data.pythonCode && (
            <button
            onClick={() => setShowPython(!showPython)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all shadow-sm active:scale-95"
            >
            <Code size={16} />
            {showPython ? "Hide Visualization Code" : "Show Visualization Code"}
            </button>
        )}
      </div>

      {/* Solution Section */}
      {showSolution && data.solution && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Eye size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Comprehensive Solution</h2>
            </div>
            
            <MarkdownRenderer content={data.solution} />

            {/* Final Answer Component */}
            {finalAnswer && (
                <div className="mt-8 flex justify-end">
                    <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Final Result</span>
                        <div className="text-xl font-bold text-slate-900">
                             <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                             >
                                 {`$${finalAnswer}$`}
                             </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Python Code Section */}
      {showPython && data.pythonCode && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-slide-up">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Python Visualization Script</h3>
                <span className="text-xs text-slate-500 font-mono">Python 3</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-slate-700 bg-white">
                {data.pythonCode}
            </pre>
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;