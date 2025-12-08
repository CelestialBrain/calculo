import React, { useRef, useEffect } from 'react';
import { X, Terminal, Cpu, Clock, FileText, Database, Zap, Loader2 } from 'lucide-react';
import { MathProblemState } from '../types';

interface DebugHUDProps {
  isVisible: boolean;
  onClose: () => void;
  data: MathProblemState | null;
  isLive?: boolean;
}

const DebugHUD: React.FC<DebugHUDProps> = ({ isVisible, onClose, data, isLive }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
      if (reportRef.current) reportRef.current.scrollTop = reportRef.current.scrollHeight;
  }, [data?.analystReport]);

  useEffect(() => {
      if (promptRef.current) promptRef.current.scrollTop = promptRef.current.scrollHeight;
  }, [data?.debugPrompt]);

  if (!isVisible) return null;

  const metrics = data?.debugMetrics;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-slate-900 shadow-2xl z-[60] text-slate-300 font-mono text-xs flex flex-col border-l border-slate-700 animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-950">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="font-bold tracking-wider text-emerald-400">DEVELOPER HUD</span>
          {isLive && (
              <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-900/50 border border-red-800 text-red-400 text-[10px] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  LIVE
              </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 1. Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800 rounded border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock size={12} />
                    <span className="uppercase font-bold text-[10px]">Latency</span>
                </div>
                <div className="text-xl font-bold text-white">
                    {metrics?.latencyMs ? `${(metrics.latencyMs / 1000).toFixed(2)}s` : '--'}
                </div>
            </div>
            
            <div className="p-3 bg-slate-800 rounded border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Cpu size={12} />
                    <span className="uppercase font-bold text-[10px]">Tokens (I/O)</span>
                </div>
                <div className="text-xl font-bold text-white">
                    {metrics ? `${metrics.inputTokens} / ${metrics.outputTokens}` : '--'}
                </div>
            </div>
        </div>

        {/* 2. Model Info */}
        <div className="p-3 bg-slate-800/50 rounded border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" />
                <span className="font-bold text-slate-200">Active Model</span>
            </div>
            <div className="flex items-center gap-2">
                {isLive && <Loader2 size={12} className="animate-spin text-slate-500" />}
                <span className="px-2 py-1 bg-slate-950 rounded text-emerald-400 border border-slate-800">
                    {metrics?.model || 'gemini-2.5-flash'}
                </span>
            </div>
        </div>

        {/* 3. Analyst Report */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-slate-700 pb-1">
                <Database size={14} />
                <span>ANALYST REPORT (gemini-2.5-flash)</span>
            </div>
            <div 
                ref={reportRef}
                className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto max-h-60 overflow-y-auto"
            >
                {data?.analystReport ? (
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-400">
                        {data.analystReport}
                    </pre>
                ) : (
                    <div className="flex items-center gap-2 text-slate-600 italic">
                        {isLive && <Loader2 size={12} className="animate-spin" />}
                        <span>Waiting for analysis stream...</span>
                    </div>
                )}
            </div>
        </div>

        {/* 4. Architect Prompt */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-slate-700 pb-1">
                <FileText size={14} />
                <span>ARCHITECT PROMPT (gemini-3-pro)</span>
            </div>
            <div 
                ref={promptRef}
                className="p-3 bg-slate-950 rounded border border-slate-800 overflow-x-auto max-h-60 overflow-y-auto"
            >
                {data?.debugPrompt ? (
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-400">
                        {data.debugPrompt}
                    </pre>
                ) : (
                    <div className="flex items-center gap-2 text-slate-600 italic">
                        {isLive && <Loader2 size={12} className="animate-spin" />}
                        <span>Waiting for prompt generation...</span>
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 bg-slate-950 text-[10px] text-slate-600 text-center">
        Hybrid Architecture • Flash Analysis • Pro Synthesis
      </div>
    </div>
  );
};

export default DebugHUD;