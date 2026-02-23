// src/components/InvestmentModal.js
'use client';

import { useState, useEffect } from 'react';
import {
  addInvestment,
  updateInvestment,
  INVESTMENT_TYPES,
  INVESTMENT_STATUS,
  getInvestmentTypeLabel
} from '@/lib/investmentCollections';
import { X, Save } from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function InvestmentModal({ isOpen, onClose, investment, userId, onSuccess }) {
  const isEditing = !!investment;
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: INVESTMENT_TYPES.STOCK,
    name: '',
    symbol: '',
    exchange: '',
    institution: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    quantity: '1',
    currentValue: '',
    status: INVESTMENT_STATUS.ACTIVE,
    interestRate: '',
    maturityDate: '',
    maturityAmount: '',
    monthlyAmount: '',
    period: '',
    certificateNumber: '',
    issueDate: '',
    address: '',
    propertyType: '',
    category: 'growth',
    riskLevel: 'medium',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (investment) {
        // Editing - populate form
        setFormData({
          type: investment.type || INVESTMENT_TYPES.STOCK,
          name: investment.name || '',
          symbol: investment.symbol || '',
          exchange: investment.exchange || '',
          institution: investment.institution || '',
          purchaseDate: investment.purchaseDate || new Date().toISOString().split('T')[0],
          purchasePrice: investment.purchasePrice?.toString() || '',
          quantity: investment.quantity?.toString() || '1',
          currentValue: investment.currentValue?.toString() || '',
          status: investment.status || INVESTMENT_STATUS.ACTIVE,
          interestRate: investment.interestRate?.toString() || '',
          maturityDate: investment.maturityDate || '',
          maturityAmount: investment.maturityAmount?.toString() || '',
          monthlyAmount: investment.monthlyAmount?.toString() || '',
          period: investment.period?.toString() || '',
          certificateNumber: investment.certificateNumber || '',
          issueDate: investment.issueDate || '',
          address: investment.address || '',
          propertyType: investment.propertyType || '',
          category: investment.category || 'growth',
          riskLevel: investment.riskLevel || 'medium',
          notes: investment.notes || ''
        });
      } else {
        // Reset form for new investment
        setFormData({
          type: INVESTMENT_TYPES.STOCK,
          name: '',
          symbol: '',
          exchange: '',
          institution: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          purchasePrice: '',
          quantity: '1',
          currentValue: '',
          status: INVESTMENT_STATUS.ACTIVE,
          interestRate: '',
          maturityDate: '',
          maturityAmount: '',
          monthlyAmount: '',
          period: '',
          certificateNumber: '',
          issueDate: '',
          address: '',
          propertyType: '',
          category: 'growth',
          riskLevel: 'medium',
          notes: ''
        });
      }
    }
  }, [isOpen, investment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validation
    if (!formData.name.trim()) {
      showToast('Please enter investment name', 'error');
      return;
    }

    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      showToast('Please enter valid purchase price', 'error');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      showToast('Please enter valid quantity', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare investment data
      const investmentData = {
        type: formData.type,
        name: formData.name.trim(),
        purchaseDate: formData.purchaseDate,
        purchasePrice: parseFloat(formData.purchasePrice),
        quantity: parseFloat(formData.quantity),
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : parseFloat(formData.purchasePrice),
        status: formData.status,
        category: formData.category,
        riskLevel: formData.riskLevel,
        notes: formData.notes.trim(),
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      // If not editing, initialize dividends
      if (!isEditing) {
        investmentData.dividends = [];
        investmentData.totalDividends = 0;
      }

      // Add type-specific fields
      if (formData.type === INVESTMENT_TYPES.STOCK) {
        if (formData.symbol) investmentData.symbol = formData.symbol.trim().toUpperCase();
        if (formData.exchange) investmentData.exchange = formData.exchange.trim();
      }

      if (formData.type === INVESTMENT_TYPES.FDR || formData.type === INVESTMENT_TYPES.DPS) {
        if (formData.institution) investmentData.institution = formData.institution.trim();
        if (formData.interestRate) investmentData.interestRate = parseFloat(formData.interestRate);
        if (formData.maturityDate) investmentData.maturityDate = formData.maturityDate;
        if (formData.maturityAmount) investmentData.maturityAmount = parseFloat(formData.maturityAmount);
      }

      if (formData.type === INVESTMENT_TYPES.DPS) {
        if (formData.monthlyAmount) investmentData.monthlyAmount = parseFloat(formData.monthlyAmount);
        if (formData.period) investmentData.period = parseInt(formData.period);
      }

      if (formData.type === INVESTMENT_TYPES.SAVINGS_CERTIFICATE) {
        if (formData.certificateNumber) investmentData.certificateNumber = formData.certificateNumber.trim();
        if (formData.issueDate) investmentData.issueDate = formData.issueDate;
        if (formData.maturityDate) investmentData.maturityDate = formData.maturityDate;
        if (formData.maturityAmount) investmentData.maturityAmount = parseFloat(formData.maturityAmount);
        if (formData.interestRate) investmentData.interestRate = parseFloat(formData.interestRate);
      }

      if (formData.type === INVESTMENT_TYPES.REAL_ESTATE) {
        if (formData.address) investmentData.address = formData.address.trim();
        if (formData.propertyType) investmentData.propertyType = formData.propertyType.trim();
      }

      let result;
      if (isEditing) {
        result = await updateInvestment(userId, investment.id, investmentData);
      } else {
        result = await addInvestment(userId, investmentData);
      }

      if (result.success) {
        showToast(isEditing ? 'Investment updated' : 'Investment added', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(result.error || 'Failed to save investment', 'error');
      }
    } catch (error) {
      console.error('Error saving investment:', error);
      showToast('An error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case INVESTMENT_TYPES.STOCK:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="AAPL, GOOGL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exchange
              </label>
              <input
                type="text"
                name="exchange"
                value={formData.exchange}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="NYSE, NASDAQ, DSE"
              />
            </div>
          </>
        );

      case INVESTMENT_TYPES.FDR:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank/Institution
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Grameen Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (% per year)
              </label>
              <input
                type="number"
                step="0.01"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="8.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="maturityAmount"
                value={formData.maturityAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="540000"
              />
            </div>
          </>
        );

      case INVESTMENT_TYPES.DPS:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank/Institution
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="City Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="monthlyAmount"
                value={formData.monthlyAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period (months)
              </label>
              <input
                type="number"
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="maturityAmount"
                value={formData.maturityAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="700000"
              />
            </div>
          </>
        );

      case INVESTMENT_TYPES.SAVINGS_CERTIFICATE:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Number
              </label>
              <input
                type="text"
                name="certificateNumber"
                value={formData.certificateNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="SC123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (% per year)
              </label>
              <input
                type="number"
                step="0.01"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="11.28"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maturity Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="maturityAmount"
                value={formData.maturityAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="350000"
              />
            </div>
          </>
        );

      case INVESTMENT_TYPES.REAL_ESTATE:
        return (
          <>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="123 Main St, Dhaka"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Investment' : 'Add Investment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Investment Type */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
                disabled={isEditing}
              >
                {Object.entries(INVESTMENT_TYPES).map(([key, value]) => (
                  <option key={value} value={value}>
                    {getInvestmentTypeLabel(value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Investment Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Apple Inc., Grameen Bank FDR, etc."
                required
              />
            </div>

            {/* Type-Specific Fields */}
            {renderTypeSpecificFields()}

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (per unit) *
              </label>
              <input
                type="number"
                step="0.01"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="150.00"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity/Units *
              </label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="100"
                required
              />
            </div>

            {/* Current Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Value (per unit)
              </label>
              <input
                type="number"
                step="0.01"
                name="currentValue"
                value={formData.currentValue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="180.00"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="growth">Growth</option>
                <option value="income">Income</option>
                <option value="safe">Safe/Conservative</option>
                <option value="speculative">Speculative</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Level
              </label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value={INVESTMENT_STATUS.ACTIVE}>Active</option>
                <option value={INVESTMENT_STATUS.MATURED}>Matured</option>
                <option value={INVESTMENT_STATUS.SOLD}>Sold</option>
                <option value={INVESTMENT_STATUS.CLOSED}>Closed</option>
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Update' : 'Save'} Investment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}