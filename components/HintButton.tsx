import React from 'react';
import { HelpCircle, Lightbulb, BookOpen } from 'lucide-react';

interface HintButtonProps {
  hintLevel: 'nudge' | 'partial' | 'full';
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const HintButton: React.FC<HintButtonProps> = ({ 
  hintLevel, 
  onClick, 
  loading = false, 
  disabled = false 
}) => {
  const configs = {
    nudge: {
      icon: <HelpCircle size={16} />,
      label: 'Nudge',
      description: 'Get a hint',
      color: 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    partial: {
      icon: <Lightbulb size={16} />,
      label: 'Partial',
      description: 'Show approach',
      color: 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200',
    },
    full: {
      icon: <BookOpen size={16} />,
      label: 'Full',
      description: 'Show full explanation',
      color: 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    },
  };

  const config = configs[hintLevel];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
        border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${config.color}
      `}
      title={config.description}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        config.icon
      )}
      <span>{config.label}</span>
    </button>
  );
};

export default HintButton;
