import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Award } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface QuizDisplayProps {
  data?: QuizQuestion[] | null;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ data }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400">No quiz data available.</div>;
  }

  const currentQuestion = data[currentQuestionIndex];
  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

  const handleSelectAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < data.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    data.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / data.length) * 100);

    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-10 text-center animate-fade-in-up shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <Award size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
        <p className="text-slate-500 mb-8">You scored {score} out of {data.length}</p>
        
        <div className="text-5xl font-extrabold text-[#007AFF] mb-8">
            {percentage}%
        </div>

        <div className="space-y-6 text-left mb-10">
            {data.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;
                return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                        <div className="flex items-start gap-3">
                             {isCorrect ? <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} /> : <XCircle className="text-red-500 shrink-0 mt-1" size={18} />}
                             <div className="w-full">
                                 <div className="font-semibold text-slate-800 text-sm mb-1 [&_p]:!mb-0 [&_p]:!text-sm">
                                     <MarkdownRenderer content={q.question} />
                                 </div>
                                 <div className="text-xs text-slate-500 flex items-center gap-1 [&_p]:!mb-0 [&_p]:!text-xs">
                                     <span className="font-bold shrink-0">Correct:</span>
                                     <MarkdownRenderer content={q.options[q.correctAnswer]} />
                                 </div>
                             </div>
                        </div>
                    </div>
                )
            })}
        </div>

        <button 
            onClick={resetQuiz}
            className="px-6 py-3 bg-[#007AFF] text-white rounded-xl font-semibold hover:bg-[#0062cc] transition-colors flex items-center gap-2 mx-auto"
        >
            <RotateCcw size={18} /> Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 w-full">
            <div 
                className="h-full bg-[#007AFF] transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / data.length) * 100}%` }}
            ></div>
        </div>

        <div className="p-8 md:p-10">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {data.length}</span>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-mono text-slate-500">Topic: Math</span>
            </div>

            <div className="text-xl md:text-2xl font-bold text-slate-900 mb-8 leading-relaxed [&_p]:!mb-0 [&_p]:!text-inherit">
                <MarkdownRenderer content={currentQuestion.question} />
            </div>

            <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                    const isCorrect = currentQuestion.correctAnswer === idx;
                    
                    let cardClass = "border-slate-200 hover:border-blue-300 hover:bg-slate-50";
                    if (isAnswered) {
                        if (isSelected && isCorrect) cardClass = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500";
                        else if (isSelected && !isCorrect) cardClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                        else if (!isSelected && isCorrect) cardClass = "border-emerald-500 bg-emerald-50 border-dashed opacity-70";
                        else cardClass = "border-slate-100 opacity-50";
                    } else if (isSelected) {
                        cardClass = "border-[#007AFF] bg-blue-50 ring-1 ring-[#007AFF]";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelectAnswer(idx)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 group ${cardClass}`}
                        >
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-current' : 'border-slate-300'
                            }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current"></div>}
                            </div>
                            <div className="text-slate-700 font-medium text-lg [&_p]:!mb-0 [&_p]:!text-lg">
                                <MarkdownRenderer content={option} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl animate-slide-up">
                    <p className="text-sm font-bold text-slate-700 mb-1">Explanation</p>
                    <div className="text-slate-600 leading-relaxed text-sm [&_p]:!mb-2 [&_p]:last:mb-0">
                        <MarkdownRenderer content={currentQuestion.explanation} />
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex items-center gap-2 px-6 py-3 bg-[#007AFF] hover:bg-[#0062cc] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold transition-all shadow-sm"
            >
                {currentQuestionIndex === data.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;