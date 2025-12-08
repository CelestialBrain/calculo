import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ProblemDisplay from './components/ProblemDisplay';
import ReasoningSidebar from './components/ReasoningSidebar';
import HistorySidebar from './components/HistorySidebar';
import { generateProblem, generateProblemImage } from './services/gemini';
import { MathProblemState, AppStatus, FileData, GeneratedImage, HistoryItem } from './types';
import { Calculator, Image as ImageIcon, RotateCcw, AlertCircle, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [problemData, setProblemData] = useState<MathProblemState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('math_architect_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('math_architect_history', JSON.stringify(history));
  }, [history]);

  const parseGeminiResponse = (text: string): MathProblemState => {
    // Helper to extract sections safely, supporting both ## and ###
    const extractSection = (headerPattern: string, nextHeaderPattern: string) => {
        const regex = new RegExp(`${headerPattern}\\s*([\\s\\S]*?)(?=${nextHeaderPattern}|$|### Visualization|## Visualization)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    };

    // Clean code blocks
    const cleanCode = (code: string | null) => {
        if (!code) return null;
        return code.replace(/```python/g, '').replace(/```/g, '').trim();
    };

    const H = '(?:###|##)';

    return {
        problem: extractSection(`${H}\\s*(?:Generated Problem|Problem Statement)`, `${H}\\s*Difficulty`),
        difficultyAnalysis: extractSection(`${H}\\s*Difficulty(?: Analysis)?`, `${H}\\s*Step-by-Step`),
        solution: extractSection(`${H}\\s*(?:Step-by-Step Solution|Comprehensive Solution)`, `${H}\\s*Final Answer`),
        finalResult: extractSection(`${H}\\s*Final Answer`, `${H}\\s*Visualization`),
        pythonCode: cleanCode(extractSection(`${H}\\s*Visualization(?: Code)?`, '$')),
        rawResponse: text,
    };
  };

  const handleGenerate = async (topic: string, files: FileData[]) => {
    setStatus(AppStatus.GENERATING_PROBLEM);
    setError(null);
    setProblemData(null);
    setGeneratedImage(null);
    setShowHistory(false); // Close history if open

    try {
      const rawText = await generateProblem(topic, files);
      const parsedData = parseGeminiResponse(rawText);
      setProblemData(parsedData);
      setStatus(AppStatus.SUCCESS);

      // Add to History
      const newItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        topic: topic.trim() || "Untitled Math Problem",
        data: parsedData
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (e: any) {
      setError(e.message || "Failed to generate problem.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateImage = async () => {
      if (!problemData?.problem) return;
      
      setGeneratedImage({ url: '', loading: true });
      try {
          const base64Image = await generateProblemImage(problemData.problem);
          setGeneratedImage({ url: base64Image, loading: false });
      } catch (e: any) {
          console.error(e);
          setGeneratedImage(null);
          alert("Could not generate image. " + e.message);
      }
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setProblemData(item.data);
    setStatus(AppStatus.SUCCESS);
    setGeneratedImage(null); // Reset image as it's not stored in history
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('math_architect_history');
  };

  const resetApp = () => {
      setStatus(AppStatus.IDLE);
      setProblemData(null);
      setGeneratedImage(null);
      setError(null);
  }

  const isReasoning = status === AppStatus.GENERATING_PROBLEM;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1C1C1E] selection:bg-blue-100 selection:text-blue-900 pb-20 overflow-x-hidden font-sans relative">
      
      {/* Sidebars */}
      <ReasoningSidebar isVisible={isReasoning} />
      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        history={history}
        onSelect={restoreFromHistory}
        onClear={clearHistory}
      />

      {/* History Toggle Button (Absolute Top Left) */}
      <button 
        onClick={() => setShowHistory(true)}
        className={`fixed top-6 left-6 z-30 p-3 bg-white border border-slate-200 shadow-md rounded-full text-slate-500 hover:text-[#007AFF] hover:scale-105 transition-all duration-300 ${isReasoning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="View History"
      >
        <Clock size={20} />
      </button>

      <div className={`relative z-10 max-w-5xl mx-auto px-4 md:px-6 transition-all duration-500 ease-out ${isReasoning ? 'mr-72 opacity-40 pointer-events-none blur-[2px]' : ''}`}>
        
        {/* Header */}
        <header className="py-16 text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4">
             <Calculator size={32} className="text-[#007AFF] mr-2" />
             <span className="text-2xl font-bold text-slate-900 tracking-tight">Math Architect</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Construct <span className="text-[#007AFF]">A-Level</span> Problems
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Upload your material to generate rigorous, high-level mathematics problems that demand critical thinking and conceptual synthesis.
          </p>
        </header>

        {/* Main Content */}
        {status === AppStatus.IDLE || status === AppStatus.GENERATING_PROBLEM || status === AppStatus.ERROR ? (
          <div className="animate-fade-in">
             <InputForm onGenerate={handleGenerate} status={status} />
             {error && (
                 <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 max-w-2xl mx-auto">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                 </div>
             )}
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Top Controls */}
            <div className="flex justify-between items-center max-w-4xl mx-auto">
                <button 
                    onClick={resetApp}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#007AFF] transition-colors font-medium text-sm"
                >
                    <RotateCcw size={16} /> Create New Problem
                </button>
            </div>

            {/* Render Output */}
            {problemData && <ProblemDisplay data={problemData} />}

            {/* Image Generation Section */}
            {status === AppStatus.SUCCESS && problemData && (
                 <div className="max-w-4xl mx-auto mt-12 pt-12 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div>
                             <h3 className="text-lg font-bold text-slate-900 mb-1">Visual Confirmation</h3>
                             <p className="text-slate-500 text-sm">Ask the AI to generate a precise geometric representation.</p>
                        </div>
                        <button 
                            onClick={handleGenerateImage}
                            disabled={!!generatedImage?.loading || !!generatedImage?.url}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg text-white font-medium transition-all shadow-sm"
                        >
                            <ImageIcon size={18} />
                            {generatedImage?.loading ? 'Generating...' : generatedImage?.url ? 'Generated' : 'Generate Visualization'}
                        </button>
                    </div>

                    {generatedImage?.loading && (
                        <div className="w-full aspect-video bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                            <ImageIcon size={48} className="mb-4 opacity-50" />
                            <p className="font-medium">Synthesizing diagram...</p>
                        </div>
                    )}

                    {generatedImage?.url && (
                        <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200">
                             <img src={generatedImage.url} alt="AI Generated Math Visualization" className="w-full h-auto bg-white" />
                             <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-200 translate-y-full group-hover:translate-y-0 transition-transform">
                                <p className="text-slate-800 text-sm font-medium">AI generated visualization based on problem parameters.</p>
                             </div>
                        </div>
                    )}
                 </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;