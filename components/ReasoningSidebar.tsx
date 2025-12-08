import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, BrainCircuit } from 'lucide-react';

interface ReasoningSidebarProps {
  isVisible: boolean;
}

// Expanded steps for more granular feedback
const STEPS = [
    { id: 1, text: "Ingesting Context Materials", threshold: 0 },
    { id: 2, text: "Analyst: Extracting Core Concepts", threshold: 15 },
    { id: 3, text: "Analyst: Assessing Difficulty", threshold: 30 },
    { id: 4, text: "Architect: Structuring Problem", threshold: 45 },
    { id: 5, text: "Synthesizing Mathematical Constraints", threshold: 60 },
    { id: 6, text: "Verifying Solvability & Rigor", threshold: 75 },
    { id: 7, text: "Formatting LaTeX Output", threshold: 85 },
    { id: 8, text: "Final Quality Check", threshold: 92 }
];

const ReasoningSidebar: React.FC<ReasoningSidebarProps> = ({ isVisible }) => {
    const [progress, setProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    
    // Refs to manage intervals and animation frames independently
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (isVisible) {
            // Reset state on start
            setProgress(0);
            setElapsedTime(0);
            
            const startTime = Date.now();

            // 1. Precise Timer: Updates exactly once per second
            timerRef.current = setInterval(() => {
                const now = Date.now();
                const seconds = Math.floor((now - startTime) / 1000);
                setElapsedTime(seconds);
            }, 1000);

            // 2. Smooth Progress Bar: Updates on every paint frame
            const animate = () => {
                setProgress(prev => {
                    // "Hang" at 95% until completion signal (isVisible becomes false)
                    if (prev >= 95) return 95;
                    
                    // Slightly faster increments to accommodate more steps
                    let increment = 0.25; 
                    
                    if (prev > 40) increment = 0.15; // Mid-stage 
                    if (prev > 70) increment = 0.08; // Complex logic stage
                    if (prev > 90) increment = 0.02; // Final crawl

                    return Math.min(prev + increment, 95);
                });

                animationFrameRef.current = requestAnimationFrame(animate);
            };
            
            animationFrameRef.current = requestAnimationFrame(animate);

        } else {
            // Clean up and finalize
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            
            // Visual completion indication
            setProgress(100);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isVisible]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-500">
            {/* Header with Progress & Timer */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-800 mb-1">
                    <div className="flex items-center gap-2">
                        <BrainCircuit size={18} className="text-[#007AFF]" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Reasoning Engine</h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formatTime(elapsedTime)}
                    </span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                    <div 
                        className="h-full bg-[#007AFF] transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

                    <div className="space-y-6 relative z-10">
                        {STEPS.map((step, index) => {
                            const nextStep = STEPS[index + 1];
                            const isActive = progress >= step.threshold && (index === STEPS.length - 1 || progress < nextStep.threshold);
                            const isCompleted = progress >= (index === STEPS.length - 1 ? 100 : nextStep.threshold);
                            const isPending = !isActive && !isCompleted;

                            return (
                                <div key={step.id} className="flex gap-4 items-start group">
                                    <div className="relative shrink-0 mt-0.5">
                                        {isCompleted ? (
                                            <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 transition-all duration-300 scale-100">
                                                <CheckCircle2 size={14} />
                                            </div>
                                        ) : isActive ? (
                                            <div className="w-6 h-6 rounded-full bg-white border-2 border-[#007AFF] flex items-center justify-center relative transition-all duration-300">
                                                <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-pulse"></div>
                                                <div className="absolute inset-0 rounded-full border border-[#007AFF] animate-ping opacity-20"></div>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 transition-colors duration-300"></div>
                                        )}
                                    </div>
                                    <div className={`transition-all duration-500 ${isPending ? 'opacity-40 blur-[0.5px]' : 'opacity-100 blur-0'}`}>
                                        <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {step.text}
                                        </p>
                                        {isActive && (
                                            <p className="text-[10px] text-[#007AFF] mt-0.5 font-medium animate-pulse tracking-wide uppercase">
                                                Processing...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Powered by Gemini 3 Pro
                </p>
            </div>
        </div>
    );
};

export default ReasoningSidebar;