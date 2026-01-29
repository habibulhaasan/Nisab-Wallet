// src/components/ToastNotification.js
'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function ToastNotification({ 
  message, 
  type = 'success', // 'success', 'error', 'warning'
  onClose,
  duration = 3000 
}) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-600" size={20} />,
    error: <XCircle className="text-red-600" size={20} />,
    warning: <AlertCircle className="text-yellow-600" size={20} />
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-start space-x-3 p-4 rounded-lg border ${colors[type]} shadow-lg max-w-md`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className={`text-sm font-medium ${textColors[type]} flex-1`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${textColors[type]} hover:opacity-70`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}