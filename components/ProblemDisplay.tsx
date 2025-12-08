import React, { useState, useRef, useMemo } from 'react';
import { Eye, EyeOff, Code, Activity, BrainCircuit, Copy, Check, Download, Loader2, CircleHelp, Sparkles } from 'lucide-react';
import { MathProblemState } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { explainMathStep } from '../services/gemini';
import FlashcardDeck from './FlashcardDeck';

interface ProblemDisplayProps {
  data: MathProblemState;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ data }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [showPython, setShowPython] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // State for step explanations: { [stepIndex]: { text: string, loading: boolean } }
  const [explanations, setExplanations] = useState<{[key: number]: {text: string | null, loading: boolean}}>({});
  
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);

    try {
        const element = contentRef.current;
        
        // Capture high-res canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Retina quality
            useCORS: true,
            backgroundColor: '#ffffff', // Force white bg for PDF
            ignoreElements: (el) => el.classList.contains('no-print'), // Ignore UI buttons
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const margin = 15; // mm
        const contentWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = margin;
        
        // First Page
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        // Multi-page handling (simple slice)
        while (heightLeft > 0) {
            position = heightLeft - imgHeight; // Negative offset to show next chunk
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, margin - (imgHeight - heightLeft), contentWidth, imgHeight);
            heightLeft -= (pdfHeight - margin * 2);
        }

        pdf.save('math-architect-problem.pdf');
    } catch (error) {
        console.error("PDF Export failed:", error);
        alert("Could not generate PDF. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleExplainStep = async (index: number, stepText: string) => {
      // If already loaded, don't re-fetch
      if (explanations[index]?.text || explanations[index]?.loading) return;

      setExplanations(prev => ({
          ...prev, 
          [index]: { text: null, loading: true }
      }));

      const context = `
      PROBLEM STATEMENT:
      ${data.problem}

      FULL SOLUTION:
      ${data.solution}
      `;

      const explanation = await explainMathStep(stepText, context);

      setExplanations(prev => ({
          ...prev,
          [index]: { text: explanation, loading: false }
      }));
  };

  // Split the solution into steps based on the ### Step header
  // Using useMemo to prevent re-splitting on every render
  const solutionSteps = useMemo(() => {
      if (!data.solution) return [];
      // Split by "### Step" but keep the delimiter or just rejoin manually in rendering
      // The regex `/(?=### Step)/` matches the position *before* "### Step", effectively splitting without consuming the header
      const rawSteps = data.solution.split(/(?=### Step)/g);
      return rawSteps.filter(s => s.trim().length > 0);
  }, [data.solution]);

  return (
    <div ref={contentRef} className="w-full max-w-4xl mx-auto space-y-12 animate-fade-in pb-12 bg-white/0"> 
    {/* Added bg-white/0 to ensure container exists but doesn't occlude if html2canvas checks */}
      
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

      {/* Action Buttons (Ignored during Print) */}
      <div className="flex flex-wrap justify-center gap-4 py-4 no-print">
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

        <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-base transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? "Exporting..." : "Export PDF"}
        </button>

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

      {/* 3. Solution Section - Interactive Card */}
      {showSolution && data.solution && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-lg shadow-slate-200/50 animate-slide-up">
            <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Eye size={22} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Comprehensive Solution</h2>
            </div>
            
            <div className="pl-2 space-y-12">
                {solutionSteps.length > 0 ? (
                    solutionSteps.map((step, index) => {
                        const explanation = explanations[index];
                        return (
                            <div key={index} className="relative group">
                                {/* The Step Content */}
                                <div className="prose-step relative z-10">
                                    <MarkdownRenderer content={step} />
                                </div>

                                {/* Floating Help Button - Visible on hover or if explaining */}
                                <button 
                                    onClick={() => handleExplainStep(index, step)}
                                    className={`absolute top-0 right-0 p-2 rounded-full transition-all duration-300 no-print 
                                        ${explanation?.loading || explanation?.text 
                                            ? 'text-[#007AFF] bg-blue-50 opacity-100' 
                                            : 'text-slate-300 hover:text-[#007AFF] hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                                        }`}
                                    title="Explain this step"
                                    aria-label="Explain this step"
                                >
                                    <CircleHelp size={20} />
                                </button>

                                {/* Explanation Bubble */}
                                {(explanation?.loading || explanation?.text) && (
                                    <div className="mt-4 ml-6 mr-6 p-5 bg-[#F0F7FF] border border-[#BFDBFE] rounded-2xl rounded-tl-none relative animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Little arrow connection */}
                                        <div className="absolute -top-2 left-0 w-4 h-4 bg-[#F0F7FF] border-l border-t border-[#BFDBFE] transform rotate-45"></div>
                                        
                                        <div className="relative z-10">
                                            {explanation.loading ? (
                                                <div className="flex items-center gap-3 text-[#007AFF] font-medium text-sm">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="animate-pulse">Tutor is analyzing this step...</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 items-start">
                                                    <Sparkles size={18} className="shrink-0 text-[#007AFF] mt-0.5" />
                                                    <div className="text-slate-700 text-sm leading-relaxed font-medium">
                                                        {explanation.text}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    // Fallback if regex split fails or format is different
                    <MarkdownRenderer content={data.solution} />
                )}
            </div>

            {/* 4. Final Answer - Simple Textbook Box */}
            {data.finalResult && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
                    <div className="inline-flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Answer</span>
                        <div className="px-10 py-5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 min-w-[200px] text-center shadow-sm">
                             <MarkdownRenderer content={data.finalResult} />
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

      {/* AI Concept Flashcards Section */}
      <div className="no-print">
          <FlashcardDeck 
            contextText={`${data.problem || ''}\n${data.solution || ''}`} 
            existingCards={data.flashcards} 
          />
      </div>

    </div>
  );
};

export default ProblemDisplay;