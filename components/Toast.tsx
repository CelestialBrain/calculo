import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: <CheckCircle size={20} className="text-emerald-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle size={20} className="text-red-600" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info size={20} className="text-blue-600" />,
    },
  };

  const style = styles[type];

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${style.bg} ${style.border} ${style.text} border rounded-xl px-4 py-3 shadow-lg animate-slide-up max-w-md`}
      role="alert"
    >
      {style.icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button 
        onClick={onClose}
        className="hover:bg-black/5 rounded-lg p-1 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
