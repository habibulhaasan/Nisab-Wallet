// src/components/AssetLiabilityModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar } from 'lucide-react';
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '@/lib/taxCategories';
import { addTaxAsset, updateTaxAsset, addTaxLiability, updateTaxLiability } from '@/lib/taxCollections';
import { showToast } from '@/components/Toast';

export default function AssetLiabilityModal({
  isOpen,
  onClose,
  onSuccess,
  type = 'asset', // 'asset' or 'liability'
  editingItem = null,
  taxYearDocId,
  userId
}) {
  const isEditing = !!editingItem;
  const isAsset = type === 'asset';

  const [formData, setFormData] = useState({
    type: isAsset ? 'cash_bank' : 'bank_loan',
    description: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    currentValue: '',
    // Liability-specific fields
    principal: '',
    interestRate: '',
    lender: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && editingItem) {
      setFormData({
        type: editingItem.assetType || editingItem.liabilityType,
        description: editingItem.description || '',
        acquisitionDate: editingItem.acquisitionDate || new Date().toISOString().split('T')[0],
        acquisitionCost: editingItem.acquisitionCost?.toString() || '',
        currentValue: editingItem.currentValue?.toString() || '',
        principal: editingItem.principal?.toString() || '',
        interestRate: editingItem.interestRate?.toString() || '',
        lender: editingItem.lender || '',
        startDate: editingItem.startDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [editingItem, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validation
    if (!formData.description.trim()) {
      showToast('Please enter a description', 'error');
      return;
    }

    if (isAsset && (!formData.currentValue || parseFloat(formData.currentValue) <= 0)) {
      showToast('Please enter a valid current value', 'error');
      return;
    }

    if (!isAsset && (!formData.principal || parseFloat(formData.principal) <= 0)) {
      showToast('Please enter a valid principal amount', 'error');
      return;
    }

    setSubmitting(true);

    try {
      let result;
      
      if (isAsset) {
        const data = {
          taxYearId: taxYearDocId,
          assetType: formData.type,
          description: formData.description.trim(),
          acquisitionDate: formData.acquisitionDate,
          acquisitionCost: parseFloat(formData.acquisitionCost) || 0,
          currentValue: parseFloat(formData.currentValue),
          documents: []
        };

        if (isEditing) {
          result = await updateTaxAsset(userId, editingItem.id, data);
        } else {
          result = await addTaxAsset(userId, data);
        }
      } else {
        const data = {
          taxYearId: taxYearDocId,
          liabilityType: formData.type,
          description: formData.description.trim(),
          principal: parseFloat(formData.principal),
          interestRate: parseFloat(formData.interestRate) || 0,
          lender: formData.lender.trim(),
          startDate: formData.startDate
        };

        if (isEditing) {
          result = await updateTaxLiability(userId, editingItem.id, data);
        } else {
          result = await addTaxLiability(userId, data);
        }
      }

      if (result.success) {
        showToast(isEditing ? 'Updated successfully' : 'Added successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(result.error || 'Failed to save', 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showToast('An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = isAsset ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  const selectedCategory = categories.find(c => c.id === formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            {isEditing ? 'Edit' : 'Add'} {isAsset ? 'Asset' : 'Liability'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {isAsset ? 'Asset' : 'Liability'} Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              disabled={submitting}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.nbrCode})
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-xs text-gray-500 mt-1">{selectedCategory.description}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder={isAsset ? "e.g., Toyota Corolla 2020" : "e.g., Home Loan from City Bank"}
              required
              disabled={submitting}
            />
          </div>

          {isAsset ? (
            <>
              {/* Acquisition Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              {/* Acquisition Cost & Current Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Acquisition Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-500">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.acquisitionCost}
                      onChange={(e) => setFormData(prev => ({ ...prev, acquisitionCost: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Current Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-500">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.currentValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Lender */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Lender/Creditor
                </label>
                <input
                  type="text"
                  value={formData.lender}
                  onChange={(e) => setFormData(prev => ({ ...prev, lender: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., City Bank, DBBL"
                  disabled={submitting}
                />
              </div>

              {/* Principal & Interest Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Outstanding Principal *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-500">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.principal}
                      onChange={(e) => setFormData(prev => ({ ...prev, principal: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Loan Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> {isAsset 
                ? 'Assets will be included in your IT-10BB2 (Assets & Liabilities Statement).'
                : 'Liabilities will be included in your IT-10BB2 (Assets & Liabilities Statement).'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4 sticky bottom-0 bg-white py-2 sm:py-3 -mx-3 sm:-mx-4 px-3 sm:px-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}