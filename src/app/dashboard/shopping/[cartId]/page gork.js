// src/app/dashboard/shopping/[cartId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  getShoppingCart,
  getCartItems,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  confirmCartItems,
  unconfirmCartItems,
} from '@/lib/shoppingCartCollections';
import { getAccounts } from '@/lib/firestoreCollections';
import { categoriesCollection } from '@/lib/firestoreCollections';
import { getDocs } from 'firebase/firestore';
import { getAvailableBalance } from '@/lib/goalUtils';
import {
  ArrowLeft, Plus, Edit, Trash2, CheckCircle2, Circle,
  ShoppingBag, Calendar, X, Check, Save
} from 'lucide-react';

export default function CartDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cartId = params?.cartId;

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsWithAvail, setAccountsWithAvail] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const [showAddForms, setShowAddForms] = useState(false);
  const [addFormRows, setAddFormRows] = useState([]);
  const [nextRowId, setNextRowId] = useState(1);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    categoryId: ''
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedConfirmAccountId, setSelectedConfirmAccountId] = useState('');

  // Mobile: track tapped rows to show actions
  const [tappedRows, setTappedRows] = useState({});

  useEffect(() => {
    if (user && cartId) loadData();
  }, [user, cartId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCart(),
      loadItems(),
      loadAccounts(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadCart = async () => {
    const result = await getShoppingCart(user.uid, cartId);
    if (result.success) setCart(result.cart);
    else router.push('/dashboard/shopping');
  };

  const loadItems = async () => {
    const result = await getCartItems(user.uid, cartId);
    if (result.success) setItems(result.items);
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      const enriched = await Promise.all(
        result.accounts.map(async (acc) => {
          const avail = await getAvailableBalance(user.uid, acc.id, acc.balance || 0);
          return { ...acc, availableBalance: avail };
        })
      );
      setAccounts(result.accounts);
      setAccountsWithAvail(enriched);
      if (enriched.length > 0) setSelectedConfirmAccountId(enriched[0].id);
    }
  };

  const loadCategories = async () => {
    try {
      const snapshot = await getDocs(categoriesCollection(user.uid));
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(cats);
    } catch (err) {
      console.error('Categories load error:', err);
    }
  };

  const handleShowAddForms = () => {
    setShowAddForms(true);
    setAddFormRows([
      { id: nextRowId, name: '', amount: '', categoryId: '' }
    ]);
    setNextRowId(nextRowId + 1);
  };

  const handleAddRow = () => {
    const last = addFormRows[addFormRows.length - 1] || { categoryId: '' };
    setAddFormRows([
      ...addFormRows,
      { id: nextRowId, name: '', amount: '', categoryId: last.categoryId }
    ]);
    setNextRowId(nextRowId + 1);
  };

  const handleRemoveRow = (rowId) => {
    if (addFormRows.length > 1) {
      setAddFormRows(addFormRows.filter(r => r.id !== rowId));
    }
  };

  const handleRowChange = (rowId, field, value) => {
    setAddFormRows(addFormRows.map(r =>
      r.id === rowId ? { ...r, [field]: value } : r
    ));
  };

  const handleCancelAdd = () => {
    setShowAddForms(false);
    setAddFormRows([]);
  };

  const handleSaveAllItems = async () => {
    const validRows = addFormRows.filter(row =>
      row.name.trim() && row.amount && parseFloat(row.amount) > 0 && row.categoryId
    );

    if (!validRows.length) return alert('Fill at least one complete item');

    let count = 0;
    for (const row of validRows) {
      const data = {
        name: row.name,
        amount: parseFloat(row.amount),
        quantity: 1,
        categoryId: row.categoryId,
      };
      const res = await addCartItem(user.uid, cartId, data);
      if (res.success) count++;
    }

    if (count > 0) {
      await loadData();
      setShowAddForms(false);
      setAddFormRows([]);
    } else {
      alert('Failed to save items');
    }
  };

  const handleStartEdit = (item) => {
    console.log('handleStartEdit called for item:', item.id);
    setEditingItemId(item.id);
    setEditFormData({
      name: item.name || '',
      amount: item.amount?.toString() || '',
      categoryId: item.categoryId || ''
    });
    setTappedRows(prev => ({ ...prev, [item.id]: false }));
  };

  const handleCancelEdit = () => {
    console.log('handleCancelEdit called');
    setEditingItemId(null);
    setEditFormData({ name: '', amount: '', categoryId: '' });
  };

  const handleSaveEdit = async (itemId) => {
    console.log('handleSaveEdit called for item:', itemId);
    if (!editFormData.name.trim() || !editFormData.amount || parseFloat(editFormData.amount) <= 0) {
      alert('Name and valid amount required');
      return;
    }

    const data = {
      name: editFormData.name,
      amount: parseFloat(editFormData.amount),
      categoryId: editFormData.categoryId
    };

    const res = await updateCartItem(user.uid, cartId, itemId, data);
    if (res.success) {
      await loadData();
      setEditingItemId(null);
    } else {
      alert('Update failed');
    }
  };

  const handleDeleteItem = (item) => {
    console.log('handleDeleteItem called for item:', item.id);
    setShowDeleteModal(item);
  };

  const confirmDeleteItem = async () => {
    const { id, transactionId } = showDeleteModal;
    const res = await deleteCartItem(user.uid, cartId, id, transactionId);
    if (res.success) {
      await loadData();
      setShowDeleteModal(null);
    } else {
      alert('Delete failed');
    }
  };

  const handleToggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pend = items.filter(i => !i.isConfirmed);
    setSelectedItems(prev => prev.length === pend.length ? [] : pend.map(i => i.id));
  };

  const handleConfirmItems = () => {
    if (!selectedItems.length) return alert('Select items first');
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    if (!selectedConfirmAccountId) {
      alert('Please select an account');
      return;
    }

    const result = await confirmCartItems(
      user.uid,
      cartId,
      selectedItems,
      transactionDate,
      selectedConfirmAccountId
    );

    if (result.success) {
      await loadData();
      setSelectedItems([]);
      setShowConfirmModal(false);
      alert(`${result.transactionCount} transaction(s) created successfully!`);
    } else {
      alert('Failed to create transactions: ' + (result.error || 'Unknown error'));
    }
  };

  const handleUnconfirmItem = async (itemId) => {
    if (confirm('This will delete the associated transaction. Continue?')) {
      const result = await unconfirmCartItems(user.uid, cartId, [itemId]);
      if (result.success) await loadData();
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const pendingItems = items.filter((item) => !item.isConfirmed);
  const confirmedItems = items.filter((item) => item.isConfirmed);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cart not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/shopping')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shopping Lists
        </button>

        <h1 className="text-2xl font-bold text-gray-900">{cart.name}</h1>
        {cart.description && <p className="text-sm text-gray-600 mt-1">{cart.description}</p>}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-xl font-semibold text-gray-900">{cart.totalItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-semibold text-yellow-600">{cart.pendingItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="text-xl font-semibold text-green-600">{cart.confirmedItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-semibold text-gray-900">
              ৳{(cart.totalAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && !showAddForms && (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
          <p className="text-sm text-gray-500 mb-6">Start adding items to your shopping cart</p>
          <button onClick={handleShowAddForms} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            Add Items
          </button>
        </div>
      )}

      {(items.length > 0 || showAddForms) && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Pending Items ({pendingItems.length})
                </h2>
                {pendingItems.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {selectedItems.length === pendingItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleConfirmItems}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Confirm ({selectedItems.length})
                  </button>
                )}
                {!showAddForms && (
                  <button
                    onClick={handleShowAddForms}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Items
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Add Forms */}
              {showAddForms && (
                <div className="p-4 bg-blue-50 bg-opacity-50 space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Add Multiple Items</p>
                    <button
                      onClick={handleAddRow}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Row
                    </button>
                  </div>

                  {addFormRows.map((row, index) => (
                    <div key={row.id} className="bg-white border border-blue-200 rounded-lg p-3">
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-center">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="flex-1 min-w-[140px] px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus={index === 0}
                        />

                        <select
                          value={row.categoryId}
                          onChange={(e) => handleRowChange(row.id, 'categoryId', e.target.value)}
                          className="w-full sm:w-36 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Category</option>
                          {categories
                            .filter((cat) => cat.type?.toLowerCase() === 'expense')
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>

                        <div className="relative w-full sm:w-28 flex-shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">৳</span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                          />
                        </div>

                        {addFormRows.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-2 text-gray-400 hover:text-red-600 self-center"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                    <p className="text-xs text-gray-600">
                      Note: Account will be selected during confirmation
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelAdd}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAllItems}
                        className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Items */}
              {pendingItems.map((item) => {
                const isTapped = tappedRows[item.id] || false;

                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b last:border-b-0 cursor-pointer"
                    onClick={() => {
                      setTappedRows(prev => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }));
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side: checkbox + name + category */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(item.id);
                          }}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {selectedItems.includes(item.id) ? (
                            <CheckCircle2 className="w-5 h-5 text-gray-900" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <div className="mt-0.5">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
                              {getCategoryName(item.categoryId)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: amount at top-right */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ৳{item.amount.toFixed(2)}
                        </p>
                      </div>

                      {/* Actions - hidden on mobile until tapped */}
                      <div className={`flex gap-1 flex-shrink-0 self-start ${
                        isTapped || (typeof window !== 'undefined' && window.innerWidth >= 768)
                          ? 'flex'
                          : 'hidden sm:flex'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item);
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Edit form */}
                    {editingItemId === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 bg-yellow-50 p-3 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              placeholder="Item name"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              autoFocus
                            />
                            <div className="relative w-full sm:w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">৳</span>
                              <input
                                type="number"
                                value={editFormData.amount}
                                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-right"
                              />
                            </div>
                          </div>

                          <select
                            value={editFormData.categoryId}
                            onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          >
                            <option value="">Select Category</option>
                            {categories
                              .filter((cat) => cat.type?.toLowerCase() === 'expense')
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                          </select>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmed Items */}
          {confirmedItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">
                  Confirmed Items ({confirmedItems.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {confirmedItems.map((item) => {
                  const isTapped = tappedRows[item.id] || false;

                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 bg-green-50 bg-opacity-40 hover:bg-green-100 transition-colors border-b last:border-b-0 cursor-pointer"
                      onClick={() => {
                        setTappedRows(prev => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }));
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <div className="mt-0.5">
                              <span className="inline-block px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                {getCategoryName(item.categoryId)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ৳{item.amount.toFixed(2)}
                          </p>
                        </div>

                        <div className={`flex gap-1 flex-shrink-0 self-start ${
                          isTapped || (typeof window !== 'undefined' && window.innerWidth >= 768)
                            ? 'flex'
                            : 'hidden sm:flex'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnconfirmItem(item.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Confirm Items</h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Creating transactions for {selectedItems.length} item(s).
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Account
                </label>
                <select
                  value={selectedConfirmAccountId}
                  onChange={(e) => setSelectedConfirmAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Choose account</option>
                  {accountsWithAvail.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Available: ৳{(acc.availableBalance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Selected Items:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-gray-900 truncate">{item.name}</span>
                        <span className="text-gray-600">৳{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    ৳{items
                      .filter((item) => selectedItems.includes(item.id))
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransaction}
                disabled={!selectedConfirmAccountId}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  selectedConfirmAccountId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Item?</h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{showDeleteModal.name}</strong>?
              {showDeleteModal.isConfirmed && (
                <span className="block mt-2 text-red-600">
                  This will also delete the associated transaction.
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}