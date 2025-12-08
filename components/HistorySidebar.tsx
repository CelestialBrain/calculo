import React from 'react';
import { X, Clock, Trash2, ChevronRight, LayoutList } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelect, 
  onClear 
}) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col font-sans ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
             <LayoutList size={20} className="text-[#007AFF]" />
             <h2 className="font-bold text-lg tracking-tight">Problem History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <Clock size={48} className="opacity-20" />
               <p className="text-sm font-medium">No history yet</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left group bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007AFF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate pr-4">
                  {item.topic || "General Math Challenge"}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                   <span>{formatDate(item.timestamp)}</span>
                   <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all text-[#007AFF]" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                if(window.confirm('Are you sure you want to clear your history?')) {
                  onClear();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HistorySidebar;