// src/app/dashboard/feedback/page.js
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'feedback',
    rating: 0,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const feedbackTypes = [
    { value: 'feedback', label: 'General Feedback', icon: '💬' },
    { value: 'bug', label: 'Report a Bug', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '💡' },
    { value: 'question', label: 'Question/Help', icon: '❓' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      addToast('Please enter your feedback message', 'error');
      return;
    }

    if (formData.rating === 0) {
      addToast('Please select a rating', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Save to user's feedback subcollection (this will work with current Firestore rules)
      const feedbackRef = collection(db, 'users', user.uid, 'feedback');
      await addDoc(feedbackRef, {
        type: formData.type,
        rating: formData.rating,
        message: formData.message,
        createdAt: serverTimestamp(),
        status: 'new',
        userEmail: user.email,
        userName: user.displayName || 'Anonymous',
      });

      setSubmitted(true);
      addToast('Thank you for your feedback!', 'success');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ type: 'feedback', rating: 0, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Feedback error:', error);
      addToast('Error submitting feedback: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Help us improve Nisab Wallet by sharing your thoughts</p>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Share Your Feedback</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to share?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`flex items-center space-x-2 px-3 md:px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-xs md:text-sm font-medium text-gray-700">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your experience? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="text-sm text-gray-600 ml-2">
                  {formData.rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm resize-none"
              placeholder="Tell us what you think... What features would you like to see? What problems did you encounter?"
              rows="6"
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your feedback will be sent to our team. We read every message!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Your privacy matters:</strong> We'll only use your email to respond to your feedback. 
          We won't share your information with anyone.
        </p>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}