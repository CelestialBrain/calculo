import React, { useState } from 'react';
import { Layers, RotateCw, ChevronLeft, ChevronRight, Sparkles, Brain } from 'lucide-react';
import { Flashcard } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { generateFlashcards } from '../services/gemini';

interface FlashcardDeckProps {
    contextText: string;
    existingCards?: Flashcard[] | null;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ contextText, existingCards }) => {
    const [cards, setCards] = useState<Flashcard[]>(existingCards || []);
    const [isLoading, setIsLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const newCards = await generateFlashcards(contextText);
            setCards(newCards);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextCard = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 150); // Wait for unflip if needed
    };

    const prevCard = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 150);
    };

    if (cards.length === 0) {
        return (
            <div className="mt-12 p-8 border border-slate-200 rounded-2xl bg-white text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600">
                    <Layers size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Concept Flashcards</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Identify key theorems and definitions used in this problem to reinforce your learning.
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <RotateCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isLoading ? "Synthesizing Cards..." : "Generate AI Flashcards"}
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="mt-12 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-slate-800">
                    <Brain size={20} className="text-purple-600" />
                    <h3 className="font-bold text-lg">Concept Deck</h3>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>

            {/* Card Container */}
            <div className="relative h-80 w-full perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div 
                    className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                    {/* Front */}
                    <div className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-2xl backface-hidden flex flex-col items-center justify-center p-8">
                        <span className="absolute top-4 right-4 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">
                            {currentCard.category}
                        </span>
                        <h4 className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-4">Term</h4>
                        <div className="text-2xl md:text-3xl font-bold text-slate-900">
                             <MarkdownRenderer content={currentCard.front} />
                        </div>
                        <p className="absolute bottom-6 text-xs text-slate-400 font-medium flex items-center gap-1">
                            <RotateCw size={12} /> Tap to flip
                        </p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 w-full h-full bg-slate-900 text-white rounded-2xl backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8">
                         <h4 className="text-slate-500 text-sm uppercase tracking-widest font-bold mb-4">Definition</h4>
                         <div className="text-lg md:text-xl leading-relaxed font-medium text-slate-100">
                            <MarkdownRenderer content={currentCard.back} />
                         </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
                <button 
                    onClick={prevCard}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex gap-1">
                    {cards.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-purple-600' : 'w-1.5 bg-slate-200'}`}
                        />
                    ))}
                </div>
                <button 
                    onClick={nextCard}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-sm"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default FlashcardDeck;