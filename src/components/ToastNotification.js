// src/components/ToastNotification.js
'use client';

import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export function ToastContainer({ toasts, removeToast, position = 'bottom' }) {
  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4'
  };

  return (
    <div className={`fixed right-4 ${positionClasses[position] || positionClasses.bottom} z-50 space-y-2`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg border shadow-lg ${getBackgroundColor()} animate-slide-in`}
    >
      {getIcon()}
      <p className="flex-1 text-sm text-gray-900">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default ToastContainer;