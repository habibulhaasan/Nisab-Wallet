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
import {
  ArrowLeft, Plus, Edit, Trash2, CheckCircle2, Circle,
  ShoppingBag, Calendar, AlertCircle, X, Check, ChevronDown, Save
} from 'lucide-react';

export default function CartDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cartId = params?.cartId;

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Multi-item Add Form State
  const [showAddForms, setShowAddForms] = useState(false);
  const [addFormRows, setAddFormRows] = useState([
    { id: 1, name: '', amount: '', categoryId: '', accountId: '' }
  ]);
  const [nextRowId, setNextRowId] = useState(2);

  // Inline Edit State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    accountId: ''
  });

  // Confirmation state
  const [selectedItems, setSelectedItems] = useState([]);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (user && cartId) {
      loadData();
    }
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
    if (result.success) {
      setCart(result.cart);
    } else {
      router.push('/dashboard/shopping');
    }
  };

  const loadItems = async () => {
    const result = await getCartItems(user.uid, cartId);
    if (result.success) {
      setItems(result.items);
    }
  };

  const loadAccounts = async () => {
    const result = await getAccounts(user.uid);
    if (result.success) {
      setAccounts(result.accounts);
    }
  };

  const loadCategories = async () => {
    try {
      const snapshot = await getDocs(categoriesCollection(user.uid));
      let cats = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'expense') {
          cats.push({ id: doc.id, ...data });
        }
      });
      cats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleShowAddForms = () => {
    setShowAddForms(true);
    const defaultCategoryId = '';
    const defaultAccountId = '';
    setAddFormRows([
      { id: 1, name: '', amount: '', categoryId: defaultCategoryId, accountId: defaultAccountId }
    ]);
    setNextRowId(2);
  };

  const handleAddRow = () => {
    const lastRow = addFormRows[addFormRows.length - 1];
    setAddFormRows([
      ...addFormRows,
      { 
        id: nextRowId, 
        name: '', 
        amount: '', 
        categoryId: lastRow.categoryId, // Use same category as last row
        accountId: lastRow.accountId    // Use same account as last row
      }
    ]);
    setNextRowId(nextRowId + 1);
  };

  const handleRemoveRow = (rowId) => {
    if (addFormRows.length > 1) {
      setAddFormRows(addFormRows.filter(row => row.id !== rowId));
    }
  };

  const handleRowChange = (rowId, field, value) => {
    setAddFormRows(addFormRows.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const handleCancelAdd = () => {
    setShowAddForms(false);
    setAddFormRows([
      { id: 1, name: '', amount: '', categoryId: '', accountId: '' }
    ]);
    setNextRowId(2);
  };

  const handleSaveAllItems = async () => {
    // Filter out empty rows
    const validRows = addFormRows.filter(row => 
      row.name.trim() && row.amount && parseFloat(row.amount) > 0 && row.categoryId && row.accountId
    );

    if (validRows.length === 0) {
      alert('Please fill in at least one complete item (name, amount, category, and account)');
      return;
    }

    // Add all valid items
    let successCount = 0;
    for (const row of validRows) {
      const itemData = {
        name: row.name,
        amount: parseFloat(row.amount),
        quantity: 1,
        categoryId: row.categoryId,
        accountId: row.accountId,
      };

      const result = await addCartItem(user.uid, cartId, itemData);
      if (result.success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      await loadData();
      
      // Check if there are any incomplete rows
      const hasIncompleteRows = addFormRows.some(row => 
        row.name.trim() && (!row.amount || !row.categoryId || !row.accountId)
      );

      if (hasIncompleteRows) {
        alert(`${successCount} item(s) added successfully. Some incomplete items were skipped.`);
      }

      // Reset form
      const defaultCategoryId = '';
      const defaultAccountId = '';
      setAddFormRows([
        { id: nextRowId, name: '', amount: '', categoryId: defaultCategoryId, accountId: defaultAccountId }
      ]);
      setNextRowId(nextRowId + 1);
    } else {
      alert('Failed to add items. Please check all fields.');
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditFormData({
      name: item.name,
      amount: item.amount.toString(),
      categoryId: item.categoryId,
      accountId: item.accountId
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({
      name: '',
      amount: '',
      categoryId: '',
      accountId: ''
    });
  };

  const handleSaveEdit = async (itemId) => {
    if (!editFormData.name.trim()) {
      alert('Please enter item name');
      return;
    }
    if (!editFormData.amount || parseFloat(editFormData.amount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const itemData = {
      name: editFormData.name,
      amount: parseFloat(editFormData.amount),
      categoryId: editFormData.categoryId,
      accountId: editFormData.accountId,
    };

    const result = await updateCartItem(user.uid, cartId, itemId, itemData);
    if (result.success) {
      await loadData();
      setEditingItemId(null);
    } else {
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (item) => {
    setShowDeleteModal(item);
  };

  const confirmDeleteItem = async () => {
    const result = await deleteCartItem(
      user.uid,
      cartId,
      showDeleteModal.id,
      showDeleteModal.transactionId
    );
    if (result.success) {
      await loadData();
      setShowDeleteModal(null);
    } else {
      alert('Failed to delete item');
    }
  };

  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const pendingItems = items.filter((item) => !item.isConfirmed);
    if (selectedItems.length === pendingItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pendingItems.map((item) => item.id));
    }
  };

  const handleConfirmItems = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to confirm');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    const result = await confirmCartItems(user.uid, cartId, selectedItems, transactionDate);
    if (result.success) {
      await loadData();
      setSelectedItems([]);
      setShowConfirmModal(false);
      alert(`${result.transactionCount} transaction(s) created successfully!`);
    } else {
      alert('Failed to create transactions: ' + result.error);
    }
  };

  const handleUnconfirmItem = async (itemId) => {
    if (confirm('This will delete the associated transaction. Continue?')) {
      const result = await unconfirmCartItems(user.uid, cartId, [itemId]);
      if (result.success) {
        await loadData();
      } else {
        alert('Failed to unconfirm item');
      }
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Unknown';
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
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/shopping')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shopping Lists
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cart.name}</h1>
            {cart.description && (
              <p className="text-sm text-gray-600 mt-1">{cart.description}</p>
            )}
          </div>
        </div>

        {/* Cart Summary */}
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
          <p className="text-sm text-gray-500 mb-6">
            Start adding items to your shopping cart
          </p>
          <button
            onClick={handleShowAddForms}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Items
          </button>
        </div>
      )}

      {/* Items List */}
      {(items.length > 0 || showAddForms) && (
        <div className="space-y-4">
          {/* Pending Items Section */}
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
              {/* Multi-row Add Forms */}
              {showAddForms && (
                <div className="p-3 bg-blue-50 bg-opacity-50 space-y-2">
                  <div className="flex items-center justify-between mb-2">
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
                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                      {/* Row number */}
                      <div className="col-span-1 flex justify-center">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>

                      {/* Item Name */}
                      <div className="col-span-3 overflow-hidden">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
                          autoFocus={index === 0}
                        />
                      </div>

                      {/* Amount */}
                      <div className="col-span-2 overflow-hidden">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs text-gray-500 dark:text-gray-400">৳</span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-2 overflow-hidden">
                        <select
                          value={row.categoryId}
                          onChange={(e) => handleRowChange(row.id, 'categoryId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent truncate dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Account */}
                      <div className="col-span-3 overflow-hidden">
                        <select
                          value={row.accountId}
                          onChange={(e) => handleRowChange(row.id, 'accountId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent truncate dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                          <option value="">Select Account</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remove row button */}
                      <div className="col-span-1 flex justify-center">
                        {addFormRows.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove row"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-blue-200">
                    <p className="text-xs text-gray-600">
                      Fill in item details and click Save All. Empty rows will be skipped.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelAdd}
                        className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAllItems}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Pending Items */}
              {pendingItems.map((item) => (
                <InlineEditableItemRow
                  key={item.id}
                  item={item}
                  selected={selectedItems.includes(item.id)}
                  editing={editingItemId === item.id}
                  editFormData={editFormData}
                  categories={categories}
                  accounts={accounts}
                  onToggle={handleToggleItem}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteItem}
                  onEditFormChange={setEditFormData}
                  getCategoryName={getCategoryName}
                  getAccountName={getAccountName}
                />
              ))}
            </div>
          </div>

          {/* Confirmed Items Section */}
          {confirmedItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">
                  Confirmed Items ({confirmedItems.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {confirmedItems.map((item) => (
                  <ConfirmedItemRow
                    key={item.id}
                    item={item}
                    onUnconfirm={handleUnconfirmItem}
                    getCategoryName={getCategoryName}
                    getAccountName={getAccountName}
                  />
                ))}
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
              <h2 className="text-lg font-semibold text-gray-900">Confirm Items as Transactions</h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                You're about to create transactions for {selectedItems.length} selected item(s). 
                Items with the same category and account will be grouped into single transactions.
              </p>

              {/* Transaction Date */}
              <div>
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Selected Items:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-900">{item.name}</span>
                        <span className="text-gray-600">৳{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    ৳
                    {items
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm & Create Transactions
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
                  This item is confirmed and will also delete the associated transaction.
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

// Component for Inline Editable Item Row
function InlineEditableItemRow({ 
  item, 
  selected, 
  editing, 
  editFormData, 
  categories, 
  accounts,
  onToggle, 
  onStartEdit, 
  onCancelEdit,
  onSaveEdit,
  onDelete, 
  onEditFormChange,
  getCategoryName, 
  getAccountName 
}) {
  const [showActions, setShowActions] = useState(false);

  const handleRowClick = () => {
    setShowActions(!showActions);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggle(item.id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onStartEdit(item);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(item);
  };

  if (editing) {
    // Edit Mode
    return (
      <div className="p-3 bg-yellow-50 bg-opacity-50">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Checkbox placeholder */}
          <div className="col-span-1 flex justify-center">
            <div className="w-5 h-5" />
          </div>

          {/* Item Name */}
          <div className="col-span-3 overflow-hidden">
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => onEditFormChange({ ...editFormData, name: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && onSaveEdit(item.id)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div className="col-span-2 overflow-hidden">
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-xs text-gray-500 dark:text-gray-400">৳</span>
              <input
                type="number"
                value={editFormData.amount}
                onChange={(e) => onEditFormChange({ ...editFormData, amount: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && onSaveEdit(item.id)}
                step="0.01"
                className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-span-2 overflow-hidden">
            <select
              value={editFormData.categoryId}
              onChange={(e) => onEditFormChange({ ...editFormData, categoryId: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent truncate dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div className="col-span-2 overflow-hidden">
            <select
              value={editFormData.accountId}
              onChange={(e) => onEditFormChange({ ...editFormData, accountId: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent truncate dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="col-span-2 flex items-center gap-1 justify-end">
            <button
              onClick={() => onSaveEdit(item.id)}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="p-3 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800" onClick={handleRowClick}>
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <div className="flex-shrink-0 w-6 flex justify-center" onClick={handleCheckboxClick}>
          <button>
            {selected ? (
              <CheckCircle2 className="w-5 h-5 text-gray-900 dark:text-white" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        </div>

        {/* Item Name with Category and Account */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
            {item.name} <span className="text-xs text-gray-500 dark:text-gray-400">({getCategoryName(item.categoryId)}, {getAccountName(item.accountId)})</span>
          </p>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 w-20 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">৳{item.amount.toFixed(2)}</p>
        </div>

        {/* Actions */}
        <div className={`flex-shrink-0 flex gap-1 ${showActions ? 'flex' : 'hidden md:flex'}`}>
          <button
            onClick={handleEditClick}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors dark:text-gray-500 dark:hover:text-white"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors dark:text-gray-500 dark:hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Component for Confirmed Item Row
function ConfirmedItemRow({ item, onUnconfirm, getCategoryName, getAccountName }) {
  const [showActions, setShowActions] = useState(false);

  const handleRowClick = () => {
    setShowActions(!showActions);
  };

  const handleUnconfirmClick = (e) => {
    e.stopPropagation();
    onUnconfirm(item.id);
  };

  return (
    <div className="p-3 bg-green-50 bg-opacity-50 dark:bg-green-900 dark:bg-opacity-50" onClick={handleRowClick}>
      <div className="flex items-center gap-2">
        {/* Checkmark */}
        <div className="flex-shrink-0 w-6 flex justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>

        {/* Item Name with Category and Account */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
            {item.name} <span className="text-xs text-gray-500 dark:text-gray-400">({getCategoryName(item.categoryId)}, {getAccountName(item.accountId)})</span>
          </p>
          <p className="text-xs text-green-600">✓ Transaction created</p>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 w-20 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">৳{item.amount.toFixed(2)}</p>
        </div>

        {/* Undo Button */}
        <div className={`flex-shrink-0 ${showActions ? 'flex' : 'hidden md:flex'}`}>
          <button
            onClick={handleUnconfirmClick}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors dark:text-gray-400 dark:hover:text-white"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
}