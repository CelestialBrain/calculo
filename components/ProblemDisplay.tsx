import React, { useState } from 'react';
import { Eye, EyeOff, Code, Activity, BrainCircuit, Copy, Check } from 'lucide-react';
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
  const [isCopied, setIsCopied] = useState(false);

  // Attempt to extract the final answer for the "Boxed" UI
  const extractFinalAnswer = (text: string | null) => {
    if (!text) return null;
    const match = text.match(/\\boxed\{([^}]+)\}/);
    return match ? match[1] : null;
  };

  const finalAnswer = extractFinalAnswer(data.solution);

  const handleCopy = async () => {
    if (!data.solution) return;
    try {
      await navigator.clipboard.writeText(data.solution);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 animate-fade-in pb-12">
      
      {/* 1. Problem Card - Distinct Grey Background for "Given/Find" separation */}
      <div className="bg-[#F9FAFB] rounded-2xl p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#007AFF]"></div>
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-5">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-[#007AFF] shadow-sm">
                <BrainCircuit size={22} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Challenge Problem</h2>
        </div>
        
        {/* Content area with enhanced typography */}
        <div className="text-slate-800">
             {data.problem && <MarkdownRenderer content={data.problem} />}
        </div>
      </div>

      {/* 2. Difficulty Analysis - Subtle Note Style */}
      {data.difficultyAnalysis && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex gap-5 items-start shadow-sm mx-2">
           <div className="shrink-0 mt-1 p-2 bg-purple-50 rounded-full text-purple-600">
                <Activity size={20} />
           </div>
           <div>
               <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">Architect's Analysis</h3>
               <div className="text-base text-slate-600 leading-relaxed">
                    <MarkdownRenderer content={data.difficultyAnalysis} />
               </div>
           </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 py-4">
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#007AFF] hover:bg-[#005ecb] text-white font-semibold text-base transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          {showSolution ? <EyeOff size={18} /> : <Eye size={18} />}
          {showSolution ? "Hide Step-by-Step Solution" : "Reveal Solution Steps"}
        </button>

        {data.solution && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-base transition-all shadow-sm active:scale-95"
          >
            {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            {isCopied ? "Copied!" : "Copy Solution"}
          </button>
        )}

        {data.pythonCode && (
            <button
            onClick={() => setShowPython(!showPython)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-base transition-all shadow-sm active:scale-95"
            >
            <Code size={18} />
            {showPython ? "Hide Code" : "Visualize with Python"}
            </button>
        )}
      </div>

      {/* 3. Solution Section - White Card */}
      {showSolution && data.solution && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-lg shadow-slate-200/50 animate-slide-up">
            <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Eye size={22} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Comprehensive Solution</h2>
            </div>
            
            <div className="pl-2">
                <MarkdownRenderer content={data.solution} />
            </div>

            {/* 4. Final Answer - Centered & Prominent */}
            {finalAnswer && (
                <div className="mt-16 flex flex-col items-center justify-center animate-fade-in">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Final Result</span>
                    <div className="inline-block px-12 py-8 bg-white border-2 border-slate-900 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl font-bold text-slate-900">
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md animate-slide-up mt-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Python Visualization Script</h3>
                <span className="text-xs text-slate-500 font-mono bg-slate-200 px-2 py-1 rounded">Python 3.9+</span>
            </div>
            <pre className="p-8 overflow-x-auto text-sm font-mono text-slate-700 bg-white leading-relaxed">
                {data.pythonCode}
            </pre>
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;