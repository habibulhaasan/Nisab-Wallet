// src/components/ConfirmDialog.js
'use client';

import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // danger, info, success, warning
  confirmButtonClass = '',
  showCancel = true,
  // Input Props for advanced use cases
  requireInput = false,
  requireDays = false,
  requireNote = false,
  inputPlaceholder = 'Enter details...',
  inputValue = '',
  onInputChange = () => {},
  daysValue = '',
  onDaysChange = () => {},
  noteValue = '',
  onNoteChange = () => {}
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'success': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'info': return <Info className="w-6 h-6 text-blue-600" />;
      default: return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white';
      default: return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    }
  };

  const isConfirmDisabled = requireInput && (requireNote ? !noteValue?.trim() : !inputValue?.trim());

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-full">{getIcon()}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>
            <div className="mt-1 text-sm text-gray-500">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {requireInput && (
          <div className="my-5 space-y-4">
            {requireNote ? (
              <textarea
                value={noteValue}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => { onConfirm(); onClose(); }}
            disabled={isConfirmDisabled}
            className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50 ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// THIS IS THE NAMED EXPORT YOUR PAGE WAS MISSING
export function AlertDialog({ isOpen, onClose, title, message, type = 'info', buttonText = 'OK' }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title={title}
      message={message}
      type={type}
      confirmText={buttonText}
      showCancel={false}
    />
  );
}