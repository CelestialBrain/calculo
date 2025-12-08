import React, { useEffect, useState, useRef } from 'react';
import { Circle, CheckCircle2, Loader2, BrainCircuit } from 'lucide-react';

interface ReasoningSidebarProps {
  isVisible: boolean;
}

const STEPS = [
    { id: 1, text: "Analyzing Geometry & Metrics", duration: 3000 },
    { id: 2, text: "Synthesizing Constraints", duration: 5000 },
    { id: 3, text: "Verifying Solvability", duration: 7000 } // Remains active until done
];

const ReasoningSidebar: React.FC<ReasoningSidebarProps> = ({ isVisible }) => {
    const [currentStep, setCurrentStep] = useState(0);
    
    useEffect(() => {
        if (isVisible) {
            setCurrentStep(0);
            
            const timers: ReturnType<typeof setTimeout>[] = [];
            let accumulatedTime = 0;

            STEPS.forEach((step, index) => {
                const timer = setTimeout(() => {
                    setCurrentStep(index + 1);
                }, accumulatedTime);
                timers.push(timer);
                accumulatedTime += step.duration;
            });

            return () => {
                timers.forEach(clearTimeout);
            };
        } else {
            setCurrentStep(0);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 w-72 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col font-sans">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-800 mb-1">
                    <BrainCircuit size={18} className="text-[#007AFF]" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Reasoning Engine</h3>
                </div>
            </div>

            <div className="flex-1 p-8">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

                    <div className="space-y-10 relative z-10">
                        {STEPS.map((step, index) => {
                            const stepNumber = index + 1;
                            const isActive = currentStep === stepNumber;
                            const isCompleted = currentStep > stepNumber;
                            const isPending = currentStep < stepNumber;

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