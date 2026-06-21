import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-400" />,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-slate-900/95 shadow-emerald-500/5',
    error: 'border-rose-500/30 bg-slate-900/95 shadow-rose-500/5',
    warning: 'border-amber-500/30 bg-slate-900/95 shadow-amber-500/5',
    info: 'border-sky-500/30 bg-slate-900/95 shadow-sky-500/5',
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-bounce-short ${colors[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium text-slate-200">{message}</span>
      <button 
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
