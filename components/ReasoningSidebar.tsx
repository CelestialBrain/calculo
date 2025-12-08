import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, BrainCircuit } from 'lucide-react';

interface ReasoningSidebarProps {
  isVisible: boolean;
}

const STEPS = [
    { id: 1, text: "Analyzing Geometry & Metrics", threshold: 0 },
    { id: 2, text: "Synthesizing Constraints", threshold: 30 },
    { id: 3, text: "Verifying Solvability", threshold: 65 },
    { id: 4, text: "Final Polish", threshold: 85 }
];

const ReasoningSidebar: React.FC<ReasoningSidebarProps> = ({ isVisible }) => {
    const [progress, setProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>();

    useEffect(() => {
        if (isVisible) {
            setProgress(0);
            setElapsedTime(0);
            startTimeRef.current = Date.now();
            
            const animate = () => {
                const now = Date.now();
                setElapsedTime((now - (startTimeRef.current || now)) / 1000);

                setProgress(prev => {
                    // "Hang" at 90% until completion
                    if (prev >= 90) return 90;
                    
                    // Variable speed curve simulation
                    let increment = 0.3; // Fast start (~18%/sec)
                    
                    if (prev > 50) increment = 0.1; // Slow down (~6%/sec)
                    if (prev > 80) increment = 0.02; // Crawl (~1.2%/sec)

                    return Math.min(prev + increment, 90);
                });

                animationFrameRef.current = requestAnimationFrame(animate);
            };
            
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            // Zip to 100% when complete (handled before unmount if possible)
            setProgress(100);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isVisible]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-72 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col font-sans">
            {/* Header with Progress & Timer */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-800 mb-1">
                    <div className="flex items-center gap-2">
                        <BrainCircuit size={18} className="text-[#007AFF]" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Reasoning Engine</h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{formatTime(elapsedTime)}</span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                    <div 
                        className="h-full bg-[#007AFF] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1 p-8">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

                    <div className="space-y-10 relative z-10">
                        {STEPS.map((step, index) => {
                            const nextStep = STEPS[index + 1];
                            const isActive = progress >= step.threshold && (index === STEPS.length - 1 || progress < nextStep.threshold);
                            const isCompleted = progress >= (index === STEPS.length - 1 ? 100 : nextStep.threshold);
                            const isPending = !isActive && !isCompleted;

                            return (
                                <div key={step.id} className="flex gap-4 items-start">
                                    <div className="relative shrink-0">
                                        {isCompleted ? (
                                            <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                                <CheckCircle2 size={14} />
                                            </div>
                                        ) : isActive ? (
                                            <div className="w-6 h-6 rounded-full bg-white border-2 border-[#007AFF] flex items-center justify-center relative">
                                                <div className="w-2 h-2 bg-[#007AFF] rounded-full animate-pulse"></div>
                                                <div className="absolute inset-0 rounded-full border border-[#007AFF] animate-ping opacity-20"></div>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200"></div>
                                        )}
                                    </div>
                                    <div className={`pt-0.5 transition-opacity duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                                        <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {step.text}
                                        </p>
                                        {isActive && (
                                            <p className="text-xs text-[#007AFF] mt-1 font-medium animate-pulse">Processing...</p>
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