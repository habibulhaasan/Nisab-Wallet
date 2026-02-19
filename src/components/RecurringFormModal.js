// src/components/RecurringFormModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Repeat, DollarSign, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { addRecurringTransaction, updateRecurringTransaction } from '@/lib/recurringTransactionsCollections';
import { showToast } from '@/components/Toast';

export default function RecurringFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingRecurring = null,
  accounts = [],
  categories = [],
  userId,
}) {
  const isEditing = !!editingRecurring;

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    accountId: '',
    categoryId: '',
    frequency: 'monthly',
    interval: '1',
    dayOfWeek: '1', // Monday
    dayOfMonth: '1',
    customDates: [],
    startDate: new Date().toISOString().split('T')[0],
    endCondition: 'never',
    endDate: '',
    occurrences: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');

  useEffect(() => {
    if (isEditing && editingRecurring) {
      setFormData({
        type: editingRecurring.type,
        amount: editingRecurring.amount.toString(),
        accountId: editingRecurring.accountId,
        categoryId: editingRecurring.categoryId,
        frequency: editingRecurring.frequency,
        interval: editingRecurring.interval.toString(),
        dayOfWeek: editingRecurring.dayOfWeek?.toString() || '1',
        dayOfMonth: editingRecurring.dayOfMonth?.toString() || '1',
        customDates: editingRecurring.customDates || [],
        startDate: editingRecurring.startDate,
        endCondition: editingRecurring.endCondition,
        endDate: editingRecurring.endDate || '',
        occurrences: editingRecurring.occurrences?.toString() || '',
        description: editingRecurring.description || '',
      });
    } else {
      // Set default account and category
      if (accounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
      }
    }
  }, [editingRecurring, accounts, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!formData.accountId) {
      showToast('Please select an account', 'error');
      return;
    }

    if (!formData.categoryId) {
      showToast('Please select a category', 'error');
      return;
    }

    if (formData.frequency === 'custom' && formData.customDates.length === 0) {
      showToast('Please add at least one custom date', 'error');
      return;
    }

    if (formData.endCondition === 'until' && !formData.endDate) {
      showToast('Please select an end date', 'error');
      return;
    }

    if (formData.endCondition === 'after' && (!formData.occurrences || parseInt(formData.occurrences) <= 0)) {
      showToast('Please enter number of occurrences', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        frequency: formData.frequency,
        interval: parseInt(formData.interval),
        dayOfWeek: formData.frequency === 'weekly' ? parseInt(formData.dayOfWeek) : null,
        dayOfMonth: formData.frequency === 'monthly' ? parseInt(formData.dayOfMonth) : null,
        customDates: formData.frequency === 'custom' ? formData.customDates : [],
        startDate: formData.startDate,
        endCondition: formData.endCondition,
        endDate: formData.endCondition === 'until' ? formData.endDate : null,
        occurrences: formData.endCondition === 'after' ? parseInt(formData.occurrences) : null,
        description: formData.description.trim(),
      };

      let result;
      if (isEditing) {
        result = await updateRecurringTransaction(userId, editingRecurring.id, data);
      } else {
        result = await addRecurringTransaction(userId, data);
      }

      if (result.success) {
        showToast(isEditing ? 'Updated successfully' : 'Created successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(result.error || 'Failed to save', 'error');
      }
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      showToast('An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomDate = () => {
    if (customDateInput && !formData.customDates.includes(customDateInput)) {
      setFormData(prev => ({
        ...prev,
        customDates: [...prev.customDates, customDateInput].sort(),
      }));
      setCustomDateInput('');
    }
  };

  const handleRemoveCustomDate = (date) => {
    setFormData(prev => ({
      ...prev,
      customDates: prev.customDates.filter(d => d !== date),
    }));
  };

  const filteredCategories = categories.filter(
    cat => cat.type?.toLowerCase() === formData.type
  );

  const weekDays = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Selector */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income', categoryId: '' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'income'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                    formData.type === 'income' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'income' ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    Income
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense', categoryId: '' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'expense'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${
                    formData.type === 'expense' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'expense' ? 'text-red-900' : 'text-gray-600'
                  }`}>
                    Expense
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">৳</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Account and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Avail: ৳{(acc.availableBalance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="">Select Category</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              disabled={submitting || isEditing}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Dates</option>
            </select>
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                Frequency cannot be changed. Delete and create new if needed.
              </p>
            )}
          </div>

          {/* Interval */}
          {formData.frequency !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat Every
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.interval}
                  onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-600">
                  {formData.frequency === 'daily' && 'day(s)'}
                  {formData.frequency === 'weekly' && 'week(s)'}
                  {formData.frequency === 'monthly' && 'month(s)'}
                  {formData.frequency === 'yearly' && 'year(s)'}
                </span>
              </div>
            </div>
          )}

          {/* Day of Week (Weekly) */}
          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week *
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
                disabled={submitting}
              >
                {weekDays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day of Month (Monthly) */}
          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Month *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dayOfMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="1-31"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                For months with fewer days, last day of month will be used
              </p>
            </div>
          )}

          {/* Custom Dates */}
          {formData.frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Dates *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={handleAddCustomDate}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={submitting}
                >
                  Add
                </button>
              </div>
              {formData.customDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customDates.map((date) => (
                    <div
                      key={date}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                    >
                      <span>{new Date(date).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDate(date)}
                        className="text-gray-500 hover:text-red-600"
                        disabled={submitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              disabled={submitting}
            />
          </div>

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Condition
            </label>
            <select
              value={formData.endCondition}
              onChange={(e) => setFormData(prev => ({ ...prev, endCondition: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-2"
              disabled={submitting}
            >
              <option value="never">Never (until manually stopped)</option>
              <option value="until">Until specific date</option>
              <option value="after">After number of occurrences</option>
            </select>

            {formData.endCondition === 'until' && (
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
                disabled={submitting}
              />
            )}

            {formData.endCondition === 'after' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.occurrences}
                  onChange={(e) => setFormData(prev => ({ ...prev, occurrences: e.target.value }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="0"
                  required
                  disabled={submitting}
                />
                <span className="text-sm text-gray-600">occurrences</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., Monthly rent, Weekly groceries"
              disabled={submitting}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Transactions will be created automatically on due dates</li>
                  <li>Available balance will be checked before creating</li>
                  <li>If insufficient, you'll be notified to approve manually</li>
                  <li>You can pause or delete anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}