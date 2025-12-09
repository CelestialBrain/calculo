import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ProblemDisplay from './components/ProblemDisplay';
import ProblemSkeleton from './components/ProblemSkeleton';
import Toast from './components/Toast';
import ReasoningSidebar from './components/ReasoningSidebar';
import DebugHUD from './components/DebugHUD';
import FlashcardDeck from './components/FlashcardDeck';
import QuizDisplay from './components/QuizDisplay';
import { generateMathContent, generateProblemImage, DebugUpdate } from './services/gemini';
import { MathProblemState, AppStatus, FileData, GeneratedImage, HistoryItem, GenerationMode, ToastState } from './types';
import { 
  Calculator, 
  Image as ImageIcon, 
  RotateCcw, 
  AlertCircle, 
  Clock, 
  Terminal,
  LayoutDashboard,
  Trash2,
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [problemData, setProblemData] = useState<MathProblemState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState('calculo'); // Default active tab
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  
  // Live Debug State for real-time HUD updates
  const [liveDebugData, setLiveDebugData] = useState<Partial<MathProblemState>>({});
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('math_architect_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('math_architect_history', JSON.stringify(history));
  }, [history]);

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + . - Toggle debug
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
      // Ctrl/Cmd + H - Toggle history
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setActiveTab(prev => prev === 'history' ? 'calculo' : 'history');
        setShowHistorySidebar(prev => !prev);
      }
      // Ctrl/Cmd + Enter - Trigger generation when idle
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (status === AppStatus.IDLE) {
          // Trigger form submission if possible
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  const parseGeminiResponse = (text: string): Partial<MathProblemState> => {
    const extractSection = (headerPattern: string, nextHeaderPattern: string) => {
        const regex = new RegExp(`${headerPattern}\\s*([\\s\\S]*?)(?=${nextHeaderPattern}|$|### Visualization|## Visualization)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    };
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

  const handleGenerate = async (topic: string, files: FileData[], difficulty: number, mode: GenerationMode) => {
    setStatus(AppStatus.GENERATING_PROBLEM);
    setError(null);
    setProblemData(null);
    setGeneratedImage(null);
    setLiveDebugData({}); 
    setActiveTab('calculo'); // Ensure we are on the main tab

    try {
      const resultData = await generateMathContent(topic, files, difficulty, mode, (update: DebugUpdate) => {
         setLiveDebugData(prev => ({
             ...prev,
             analystReport: update.analystReport || prev.analystReport,
             debugPrompt: update.debugPrompt || prev.debugPrompt,
             debugMetrics: { 
                ...prev.debugMetrics, 
                model: update.model || prev.debugMetrics?.model || 'gemini-2.5-flash',
                latencyMs: 0,
                inputTokens: 0,
                outputTokens: 0
             } as any
         }));
      });
      
      let finalData: MathProblemState = {
          mode: mode,
          problem: null,
          difficultyAnalysis: null,
          solution: null,
          finalResult: null,
          pythonCode: null,
          rawResponse: resultData.rawResponse || null,
          analystReport: resultData.analystReport,
          debugPrompt: resultData.debugPrompt,
          debugMetrics: resultData.debugMetrics,
          flashcards: resultData.flashcards,
          quiz: resultData.quiz
      };

      if (mode === 'PROBLEM' && resultData.rawResponse) {
          const parsed = parseGeminiResponse(resultData.rawResponse);
          finalData = { ...finalData, ...parsed };
      }

      setProblemData(finalData);
      setLiveDebugData(finalData); 
      setStatus(AppStatus.SUCCESS);

      const newItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        topic: topic.trim() || `Untitled ${mode}`,
        data: finalData
      };
      setHistory(prev => [newItem, ...prev]);
      
      // Show success toast
      showToast(`${mode === 'PROBLEM' ? 'Problem' : mode === 'QUIZ' ? 'Quiz' : 'Flashcards'} generated successfully!`, 'success');

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate content.");
      setStatus(AppStatus.ERROR);
      showToast('Failed to generate content. Please try again.', 'error');
    }
  };

  const handleGenerateImage = async () => {
      if (!problemData?.problem) return;
      setGeneratedImage({ url: '', loading: true });
      showToast('Generating image...', 'info');
      try {
          const base64Image = await generateProblemImage(problemData.problem);
          setGeneratedImage({ url: base64Image, loading: false });
          showToast('Image generated successfully!', 'success');
      } catch (e: any) {
          console.error(e);
          setGeneratedImage(null);
          showToast('Failed to generate image. ' + e.message, 'error');
      }
  };

  const handleSimilarProblems = (problems: string) => {
      // Store similar problems in a toast or modal
      showToast('Similar problems generated! Check the console.', 'info');
      console.log('Similar Problems:\n', problems);
      // You could also create a modal or new section to display these
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setProblemData(item.data);
    setLiveDebugData(item.data); 
    setStatus(AppStatus.SUCCESS);
    setGeneratedImage(null);
    setError(null);
    setActiveTab('calculo'); // Switch to main tab to view restored content
    showToast('Problem restored from history', 'success');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your history?')) {
        setHistory([]);
        localStorage.removeItem('math_architect_history');
        showToast('History cleared', 'success');
    }
  };

  const resetApp = () => {
      setStatus(AppStatus.IDLE);
      setProblemData(null);
      setLiveDebugData({});
      setGeneratedImage(null);
      setError(null);
  }

  const isReasoning = status === AppStatus.GENERATING_PROBLEM;

  // --- Sidebar Component ---
  const NavItem = ({ icon, label, id }: { icon: React.ReactNode, label: string, id: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isActive 
            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">
      
      {/* 1. Calculo Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-40 hidden md:flex">
         <div className="p-8">
            <h1 className="text-3xl font-bold text-[#2563EB] tracking-tight">Calculo</h1>
         </div>
         
         <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto">
            {/* Simplified Navigation */}
            <NavItem id="calculo" icon={<Calculator />} label="Problem Architect" />
            <NavItem id="history" icon={<Clock />} label="History" />
         </nav>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 md:ml-72 relative min-h-screen pb-20 overflow-x-hidden">
        
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between mb-4">
             <span className="text-2xl font-bold text-[#2563EB]">Calculo</span>
        </div>

        {/* --- Content Switching --- */}
        {activeTab === 'calculo' ? (
           /* --- CALCULO MODULE --- */
           <div className={`transition-all duration-500 ease-out ${isReasoning ? 'mr-0 md:mr-80 opacity-60 pointer-events-none blur-[1px]' : ''}`}>
             
             {/* Calculo Header */}
             <div className="px-8 py-10 md:py-12 max-w-5xl mx-auto">
                 <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Problem Architect</h2>
                 <p className="text-slate-500 text-lg">Construct rigorous, high-level mathematics problems.</p>
             </div>

             <div className="max-w-5xl mx-auto px-4 md:px-8">
                {/* Input / Problem View */}
                {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
                  <div className="animate-fade-in pb-12">
                     <InputForm onGenerate={handleGenerate} status={status} />
                     {error && (
                         <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 max-w-2xl mx-auto">
                            <AlertCircle size={20} />
                            <p>{error}</p>
                         </div>
                     )}
                  </div>
                ) : status === AppStatus.GENERATING_PROBLEM ? (
                  <div className="animate-fade-in pb-12">
                     <ProblemSkeleton />
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in-up pb-20">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-sm font-semibold text-slate-500">Active Session</span>
                        <button 
                            onClick={resetApp}
                            className="flex items-center gap-2 text-[#2563EB] hover:text-blue-700 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <RotateCcw size={16} /> New Problem
                        </button>
                    </div>

                    {problemData && (
                        <>
                            {problemData.mode === 'PROBLEM' && (
                                <>
                                    <ProblemDisplay data={problemData} onSimilarProblems={handleSimilarProblems} />
                                    <div className="mt-12 pt-12 border-t border-slate-200">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
                                            <div>
                                                <h3 className="text-xl font-bold mb-1">Visual Confirmation</h3>
                                                <p className="text-slate-400 text-sm">Generate a precise geometric representation.</p>
                                            </div>
                                            <button 
                                                onClick={handleGenerateImage}
                                                disabled={!!generatedImage?.loading || !!generatedImage?.url}
                                                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold transition-all"
                                            >
                                                <ImageIcon size={18} />
                                                {generatedImage?.loading ? 'Generating...' : generatedImage?.url ? 'View Image' : 'Generate'}
                                            </button>
                                        </div>

                                        {generatedImage?.url && (
                                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-slide-up">
                                                <img src={generatedImage.url} alt="AI Math" className="w-full h-auto bg-white" />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            {problemData.mode === 'FLASHCARDS' && problemData.flashcards && (
                                 <div className="max-w-2xl mx-auto">
                                    <FlashcardDeck contextText="" existingCards={problemData.flashcards} />
                                 </div>
                            )}
                            {problemData.mode === 'QUIZ' && problemData.quiz && (
                                <QuizDisplay data={problemData.quiz} />
                            )}
                        </>
                    )}
                  </div>
                )}
             </div>
           </div>
        ) : activeTab === 'history' ? (
            /* --- HISTORY MODULE --- */
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                    <div>
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">History</h2>
                    <p className="text-slate-500 text-lg">Your previously generated content.</p>
                    </div>
                    {history.length > 0 && (
                        <button 
                        onClick={clearHistory}
                        className="flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
                        >
                        <Trash2 size={16} /> Clear History
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Clock size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">No history yet</p>
                        <button onClick={() => setActiveTab('calculo')} className="mt-4 text-[#2563EB] font-bold hover:underline">
                            Create your first problem
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {history.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => restoreFromHistory(item)}
                                className="group bg-white border border-slate-200 hover:border-[#2563EB] hover:shadow-md rounded-2xl p-6 cursor-pointer transition-all duration-200 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#2563EB]">
                                    <ArrowRight size={20} />
                                </div>
                                
                                <div className="mb-4">
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                        item.data.mode === 'QUIZ' ? 'bg-orange-100 text-orange-700' :
                                        item.data.mode === 'FLASHCARDS' ? 'bg-purple-100 text-purple-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {item.data.mode}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-tight">
                                        {item.topic || "Untitled Generation"}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <Clock size={12} />
                                    {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
           /* --- PLACEHOLDER FOR OTHER TABS --- */
           <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 animate-fade-in">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                 <LayoutDashboard size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Module Unavailable</h2>
              <button 
                onClick={() => setActiveTab('calculo')}
                className="mt-6 px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-semibold shadow-sm hover:bg-blue-700"
              >
                Return to Architect
              </button>
           </div>
        )}
      </main>

      {/* Sidebars (Functionality Preserved) */}
      <ReasoningSidebar isVisible={isReasoning} />

      <DebugHUD 
        isVisible={showDebug} 
        onClose={() => setShowDebug(false)} 
        data={isReasoning ? (liveDebugData as MathProblemState) : problemData} 
        isLive={isReasoning}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Footer Hints with Keyboard Shortcuts */}
      {!isReasoning && activeTab === 'calculo' && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <button 
              onClick={() => setShowDebug(prev => !prev)}
              className="p-2 text-xs font-mono text-slate-300 hover:text-slate-500 transition-colors bg-white/80 backdrop-blur rounded-lg border border-slate-200 shadow-sm"
              title="Ctrl/Cmd + . to toggle"
            >
               Debug <Terminal size={12} className="inline mb-0.5" />
            </button>
            <div className="text-[10px] font-mono text-slate-400 bg-white/60 backdrop-blur px-2 py-1 rounded border border-slate-200 shadow-sm">
              <kbd className="font-bold">⌘.</kbd> Debug • <kbd className="font-bold">⌘H</kbd> History • <kbd className="font-bold">⌘↵</kbd> Generate
            </div>
          </div>
      )}

    </div>
  );
};

export default App;