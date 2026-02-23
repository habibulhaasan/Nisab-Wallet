// src/app/dashboard/investments/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  getInvestment,
  deleteInvestment,
  calculateReturns,
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
  addDividend,
  INVESTMENT_STATUS
} from '@/lib/investmentCollections';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  Plus,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { showToast } from '@/components/Toast';
import InvestmentModal from '@/components/InvestmentModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function InvestmentDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const investmentId = params?.id;

  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const [dividendForm, setDividendForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'dividend',
    notes: ''
  });

  useEffect(() => {
    if (user && investmentId) {
      loadInvestment();
    }
  }, [user, investmentId]);

  const loadInvestment = async () => {
    setLoading(true);
    const result = await getInvestment(user.uid, investmentId);
    if (result.success) {
      setInvestment(result.investment);
    } else {
      showToast('Investment not found', 'error');
      router.push('/dashboard/investments');
    }
    setLoading(false);
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Investment?',
      message: `Are you sure you want to delete "${investment.name}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        const result = await deleteInvestment(user.uid, investmentId);
        if (result.success) {
          showToast('Investment deleted', 'success');
          router.push('/dashboard/investments');
        } else {
          showToast('Failed to delete investment', 'error');
        }
      }
    });
  };

  const handleAddDividend = async (e) => {
    e.preventDefault();

    if (!dividendForm.amount || parseFloat(dividendForm.amount) <= 0) {
      showToast('Please enter valid amount', 'error');
      return;
    }

    const dividendData = {
      date: dividendForm.date,
      amount: parseFloat(dividendForm.amount),
      type: dividendForm.type,
      notes: dividendForm.notes.trim()
    };

    const result = await addDividend(user.uid, investmentId, dividendData);
    if (result.success) {
      showToast('Dividend/Interest added', 'success');
      setShowDividendModal(false);
      setDividendForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'dividend',
        notes: ''
      });
      await loadInvestment();
    } else {
      showToast('Failed to add dividend', 'error');
    }
  };

  const formatCurrency = (amount) => {
    return `৳${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPercentage = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Investment not found</p>
      </div>
    );
  }

  const returns = calculateReturns(investment);
  const isProfit = returns.absoluteReturn >= 0;
  const typeColor = getInvestmentTypeColor(investment.type);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/investments')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: typeColor }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{investment.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">
                    {getInvestmentTypeLabel(investment.type)}
                  </span>
                  {investment.symbol && (
                    <>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-medium text-gray-600">
                        {investment.symbol}
                      </span>
                    </>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      investment.status === INVESTMENT_STATUS.ACTIVE
                        ? 'bg-green-100 text-green-700'
                        : investment.status === INVESTMENT_STATUS.MATURED
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {investment.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Invested</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(returns.totalInvested)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Current Value</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(returns.totalCurrentValue)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Returns</p>
              <p className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(returns.absoluteReturn)}
              </p>
              <p className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(returns.percentageReturn)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Dividends/Interest</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(investment.totalDividends || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Purchase Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(investment.purchaseDate)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Purchase Price (per unit)</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(investment.purchasePrice)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Quantity</p>
            <p className="text-sm font-medium text-gray-900">
              {investment.quantity} {investment.type === 'stock' ? 'shares' : 'units'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Total Invested</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(returns.totalInvested)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Current Price (per unit)</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(investment.currentValue)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(investment.lastUpdated)}</p>
          </div>

          {/* Type-specific fields */}
          {investment.institution && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Institution</p>
              <p className="text-sm font-medium text-gray-900">{investment.institution}</p>
            </div>
          )}

          {investment.interestRate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
              <p className="text-sm font-medium text-gray-900">{investment.interestRate}% per year</p>
            </div>
          )}

          {investment.maturityDate && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Maturity Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(investment.maturityDate)}</p>
            </div>
          )}

          {investment.maturityAmount && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Maturity Amount</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(investment.maturityAmount)}</p>
            </div>
          )}

          {investment.monthlyAmount && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Monthly Amount</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(investment.monthlyAmount)}</p>
            </div>
          )}

          {investment.period && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Period</p>
              <p className="text-sm font-medium text-gray-900">{investment.period} months</p>
            </div>
          )}

          {investment.exchange && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Exchange</p>
              <p className="text-sm font-medium text-gray-900">{investment.exchange}</p>
            </div>
          )}

          {investment.certificateNumber && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Certificate Number</p>
              <p className="text-sm font-medium text-gray-900">{investment.certificateNumber}</p>
            </div>
          )}

          {investment.address && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Property Address</p>
              <p className="text-sm font-medium text-gray-900">{investment.address}</p>
            </div>
          )}

          {investment.propertyType && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Property Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{investment.propertyType}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-1">Category</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{investment.category}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Risk Level</p>
            <p className={`text-sm font-medium capitalize ${
              investment.riskLevel === 'high' ? 'text-red-600' :
              investment.riskLevel === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {investment.riskLevel}
            </p>
          </div>
        </div>

        {investment.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{investment.notes}</p>
          </div>
        )}
      </div>

      {/* Dividends/Interest */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Dividends & Interest
          </h2>
          <button
            onClick={() => setShowDividendModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>

        {!investment.dividends || investment.dividends.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No dividend or interest payments recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {investment.dividends.sort((a, b) => new Date(b.date) - new Date(a.date)).map((dividend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{dividend.type}</p>
                  <p className="text-xs text-gray-500">{formatDate(dividend.date)}</p>
                  {dividend.notes && (
                    <p className="text-xs text-gray-600 mt-1">{dividend.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-green-600">
                    {formatCurrency(dividend.amount)}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Total Received</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(investment.totalDividends || 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Summary
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isProfit ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="text-sm text-gray-500">Capital Gains/Loss</p>
                <p className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(returns.absoluteReturn)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(returns.percentageReturn)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Total Dividends/Interest</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(investment.totalDividends || 0)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Net Total Returns</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(returns.absoluteReturn + (investment.totalDividends || 0))}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {((((returns.absoluteReturn + (investment.totalDividends || 0)) / returns.totalInvested) * 100)).toFixed(2)}% total return
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <InvestmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        investment={investment}
        userId={user?.uid}
        onSuccess={() => {
          loadInvestment();
        }}
      />

      {/* Add Dividend Modal */}
      {showDividendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Add Dividend/Interest</h2>
              <button
                onClick={() => setShowDividendModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDividend} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={dividendForm.date}
                  onChange={(e) => setDividendForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dividendForm.amount}
                  onChange={(e) => setDividendForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="500.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={dividendForm.type}
                  onChange={(e) => setDividendForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="dividend">Dividend</option>
                  <option value="interest">Interest</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={dividendForm.notes}
                  onChange={(e) => setDividendForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDividendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
}