// src/components/ConfirmDialog.js
'use client';

import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  requireInput = false,
  requireDays = false,
  requireNote = false,
  inputPlaceholder = '',
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
      case 'danger':
        return <X className="text-red-600" size={48} />;
      case 'success':
        return <CheckCircle className="text-green-600" size={48} />;
      case 'info':
        return <Info className="text-blue-600" size={48} />;
      case 'warning':
      default:
        return <AlertCircle className="text-yellow-600" size={48} />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'warning':
      default:
        return 'bg-yellow-600 hover:bg-yellow-700';
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Input (if required) */}
        {requireInput && (
          <div className="mb-6 space-y-3">
            {requireNote ? (
              <textarea
                value={noteValue}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={inputPlaceholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            )}
            
            {requireDays && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Duration (leave empty for lifetime access)
                </label>
                <input
                  type="number"
                  value={daysValue}
                  onChange={(e) => onDaysChange(e.target.value)}
                  placeholder="Number of days (e.g., 30, 90, 365)"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {daysValue ? `Will expire in ${daysValue} days` : 'Lifetime access (no expiration)'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
            disabled={requireInput && (requireNote ? !(noteValue?.trim()) : !(inputValue?.trim()))}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}