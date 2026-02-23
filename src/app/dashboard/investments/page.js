// src/app/dashboard/investments/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getInvestments,
  calculatePortfolioSummary,
  getPortfolioAllocation,
  INVESTMENT_TYPES,
  INVESTMENT_STATUS,
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
  calculateReturns
} from '@/lib/investmentCollections';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  PieChart,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function InvestmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [investments, setInvestments] = useState([]);
  const [filteredInvestments, setFilteredInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, return, value

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [investments, filterType, filterStatus, searchQuery, sortBy]);

  const loadInvestments = async () => {
    setLoading(true);
    const result = await getInvestments(user.uid);
    if (result.success) {
      setInvestments(result.investments);
    } else {
      showToast('Failed to load investments', 'error');
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...investments];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(inv => inv.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      } else if (sortBy === 'return') {
        const returnsA = calculateReturns(a);
        const returnsB = calculateReturns(b);
        return returnsB.percentageReturn - returnsA.percentageReturn;
      } else if (sortBy === 'value') {
        const returnsA = calculateReturns(a);
        const returnsB = calculateReturns(b);
        return returnsB.totalCurrentValue - returnsA.totalCurrentValue;
      }
      return 0;
    });

    setFilteredInvestments(filtered);
  };

  const handleInvestmentClick = (investment) => {
    router.push(`/dashboard/investments/${investment.id}`);
  };

  const handleAddInvestment = () => {
    router.push('/dashboard/investments/add');
  };

  // Calculate portfolio summary
  const summary = calculatePortfolioSummary(investments);
  const allocation = getPortfolioAllocation(investments);

  const formatCurrency = (amount) => {
    return `৳${amount.toLocaleString()}`;
  };

  const formatPercentage = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Investment Portfolio
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your investments and monitor returns
            </p>
          </div>

          <button
            onClick={handleAddInvestment}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Investment
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No investments yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Start tracking your investment portfolio by adding your first investment
          </p>
          <button
            onClick={handleAddInvestment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add First Investment
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Invested</p>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary.totalInvested)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Current Value</p>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary.totalCurrentValue)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Total Returns</p>
                {summary.absoluteReturn >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className={`text-xl font-bold ${summary.absoluteReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.absoluteReturn)}
              </p>
              <p className={`text-xs ${summary.absoluteReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(summary.percentageReturn)}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Dividends/Interest</p>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(summary.totalDividends)}
              </p>
              <p className="text-xs text-gray-500">
                {summary.activeCount} active investments
              </p>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Asset Allocation
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(allocation).map(([type, data]) => (
                <div key={type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getInvestmentTypeColor(type) }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{getInvestmentTypeLabel(type)}</p>
                    <p className="text-sm font-semibold text-gray-900">{data.percentage}%</p>
                    <p className="text-xs text-gray-500">{formatCurrency(data.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {Object.entries(INVESTMENT_TYPES).map(([key, value]) => (
                    <option key={value} value={value}>
                      {getInvestmentTypeLabel(value)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value={INVESTMENT_STATUS.ACTIVE}>Active</option>
                  <option value={INVESTMENT_STATUS.MATURED}>Matured</option>
                  <option value={INVESTMENT_STATUS.SOLD}>Sold</option>
                  <option value={INVESTMENT_STATUS.CLOSED}>Closed</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="date">Purchase Date</option>
                  <option value="return">Return %</option>
                  <option value="value">Current Value</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Investment List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Investments ({filteredInvestments.length})
              </h2>
            </div>

            {filteredInvestments.length === 0 ? (
              <div className="p-12 text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No investments match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredInvestments.map((investment) => {
                  const returns = calculateReturns(investment);
                  const isProfit = returns.absoluteReturn >= 0;

                  return (
                    <div
                      key={investment.id}
                      onClick={() => handleInvestmentClick(investment)}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Color Indicator */}
                        <div
                          className="w-1 h-16 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getInvestmentTypeColor(investment.type) }}
                        ></div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {investment.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {getInvestmentTypeLabel(investment.type)}
                                </span>
                                {investment.symbol && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs font-medium text-gray-600">
                                      {investment.symbol}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right ml-4">
                              <p className="text-base font-bold text-gray-900">
                                {formatCurrency(returns.totalCurrentValue)}
                              </p>
                              <p className={`text-xs font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(returns.percentageReturn)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-gray-500 mb-0.5">Invested</p>
                              <p className="font-medium text-gray-900">
                                {formatCurrency(returns.totalInvested)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-0.5">Returns</p>
                              <p className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(returns.absoluteReturn)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-0.5">Purchase Date</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(investment.purchaseDate)}
                              </p>
                            </div>
                            {investment.quantity && (
                              <div>
                                <p className="text-gray-500 mb-0.5">Quantity</p>
                                <p className="font-medium text-gray-900">
                                  {investment.quantity} {investment.type === 'stock' ? 'shares' : 'units'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}