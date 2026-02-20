// src/components/TaxProfileModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, User, Hash } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { showToast } from '@/components/Toast';

export default function TaxProfileModal({
  isOpen,
  onClose,
  onSuccess,
  userId
}) {
  const [formData, setFormData] = useState({
    taxpayerName: '',
    tin: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', userId, 'settings', 'taxProfile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          taxpayerName: data.taxpayerName || '',
          tin: data.tin || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.taxpayerName.trim()) {
      showToast('Please enter taxpayer name', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const docRef = doc(db, 'users', userId, 'settings', 'taxProfile');
      await setDoc(docRef, {
        taxpayerName: formData.taxpayerName.trim(),
        tin: formData.tin.trim(),
        updatedAt: serverTimestamp()
      });

      showToast('Tax profile updated', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Failed to save profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Tax Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Taxpayer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxpayer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.taxpayerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxpayerName: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will appear on IT-10BB and IT-10BB2 documents
              </p>
            </div>

            {/* TIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN (Tax Identification Number)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData(prev => ({ ...prev, tin: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Enter 12-digit TIN"
                  maxLength="12"
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                12-digit Tax Identification Number (optional)
              </p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> This information will be used in all tax reports and NBR documents.
                Make sure the name matches your official documents.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Get tax profile for user
 */
export const getTaxProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'taxProfile');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, profile: docSnap.data() };
    } else {
      return { success: true, profile: { taxpayerName: '', tin: '' } };
    }
  } catch (error) {
    console.error('Error getting tax profile:', error);
    return { success: false, error: error.message };
  }
};