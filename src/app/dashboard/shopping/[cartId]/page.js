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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const [accountsWithAvailable, setAccountsWithAvailable] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Multi-item Add Form State
  const [showAddForms, setShowAddForms] = useState(false);
  const [addFormRows, setAddFormRows] = useState([]);
  const [nextRowId, setNextRowId] = useState(1);
  const [submittingItems, setSubmittingItems] = useState(false);

  // Inline Edit State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    amount: '',
    categoryId: ''
  });

  // Confirmation state
  const [selectedItems, setSelectedItems] = useState([]);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedAccount, setSelectedAccount] = useState('');
  const [confirming, setConfirming] = useState(false);

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
      // Calculate available balance for each account (matching transaction page)
      const accountsWithAvailableBalance = await Promise.all(
        result.accounts.map(async (account) => {
          const available = await getAvailableBalance(user.uid, account.id, account.balance);
          return {
            ...account,
            availableBalance: available,
          };
        })
      );
      
      setAccounts(result.accounts);
      setAccountsWithAvailable(accountsWithAvailableBalance);
    }
  };

  const loadCategories = async () => {
    try {
      const ref = collection(db, 'users', user.uid, 'categories');
      const snap = await getDocs(ref);
      const allCategories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Filter only expense categories (matching transaction page)
      const expenseCategories = allCategories.filter(c => c.type?.toLowerCase() === 'expense');
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
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
    const lastRow = addFormRows.length > 0 ? addFormRows[addFormRows.length - 1] : { categoryId: '' };
    setAddFormRows([
      ...addFormRows,
      { 
        id: nextRowId, 
        name: '', 
        amount: '', 
        categoryId: lastRow.categoryId
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
    setAddFormRows([]);
  };

  const handleSaveAllItems = async () => {
    if (submittingItems) return; // Prevent double submission
    
    // Filter out empty rows (no account needed)
    const validRows = addFormRows.filter(row => 
      row.name.trim() && row.amount && parseFloat(row.amount) > 0 && row.categoryId
    );

    if (validRows.length === 0) {
      alert('Please fill in at least one complete item (name, amount, and category)');
      return;
    }

    setSubmittingItems(true);

    // Add all valid items (without account)
    let successCount = 0;
    for (const row of validRows) {
      const itemData = {
        name: row.name,
        amount: parseFloat(row.amount),
        quantity: 1,
        categoryId: row.categoryId,
        // accountId will be assigned during confirmation
      };

      const result = await addCartItem(user.uid, cartId, itemData);
      if (result.success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      await loadData();
      setShowAddForms(false);
      setAddFormRows([]);
    } else {
      alert('Failed to add items. Please check all fields.');
    }
    
    setSubmittingItems(false);
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditFormData({
      name: item.name,
      amount: item.amount.toString(),
      categoryId: item.categoryId
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({
      name: '',
      amount: '',
      categoryId: ''
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
    if (!editFormData.categoryId) {
      alert('Please select a category');
      return;
    }

    const itemData = {
      name: editFormData.name,
      amount: parseFloat(editFormData.amount),
      categoryId: editFormData.categoryId,
      // accountId will be assigned during confirmation
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
    // Reset account selection
    setSelectedAccount('');
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    if (confirming) return; // Prevent double submission
    
    if (!selectedAccount) {
      alert('Please select an account');
      return;
    }
    
    // Calculate total amount of selected items
    const totalAmount = items
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Get selected account's available balance
    const selectedAcc = accountsWithAvailable.find(a => a.id === selectedAccount);
    if (!selectedAcc) {
      alert('Invalid account selected');
      return;
    }
    
    // Check if available balance is sufficient
    if (totalAmount > selectedAcc.availableBalance) {
      const allocated = selectedAcc.balance - selectedAcc.availableBalance;
      alert(
        `Insufficient available balance!\n\n` +
        `Account: ${selectedAcc.name}\n` +
        `Total Balance: ৳${selectedAcc.balance.toLocaleString()}\n` +
        `Allocated to Goals: ৳${allocated.toLocaleString()}\n` +
        `Available: ৳${selectedAcc.availableBalance.toLocaleString()}\n\n` +
        `Required: ৳${totalAmount.toLocaleString()}\n` +
        `Short by: ৳${(totalAmount - selectedAcc.availableBalance).toLocaleString()}`
      );
      return;
    }
    
    setConfirming(true);
    
    const result = await confirmCartItems(user.uid, cartId, selectedItems, transactionDate, selectedAccount);
    if (result.success) {
      await loadData();
      setSelectedItems([]);
      setSelectedAccount('');
      setShowConfirmModal(false);
      alert(`${result.transactionCount} transaction(s) created successfully!`);
    } else {
      alert('Failed to create transactions: ' + result.error);
    }
    
    setConfirming(false);
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
      <div className="mb-4">
        <button
          onClick={() => router.push('/dashboard/shopping')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{cart.name}</h1>
          {cart.description && (
            <p className="text-sm text-gray-600 mt-1">{cart.description}</p>
          )}
        </div>

        {/* Cart Summary - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Items</p>
            <p className="text-lg font-semibold text-gray-900">{cart.totalItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-semibold text-yellow-600">{cart.pendingItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="text-lg font-semibold text-green-600">{cart.confirmedItems || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">
              ৳{(cart.totalAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && !showAddForms && (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No items yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Start adding items to your cart
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
        <div className="space-y-3">
          {/* Pending Items Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Pending ({pendingItems.length})
                </h2>
                {pendingItems.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {selectedItems.length === pendingItems.length ? 'Deselect' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleConfirmItems}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Confirm ({selectedItems.length})
                  </button>
                )}
                {!showAddForms && (
                  <button
                    onClick={handleShowAddForms}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Multi-row Add Forms */}
              {showAddForms && (
                <div className="p-3 bg-blue-50 bg-opacity-50 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Add Items</p>
                  </div>

                  {addFormRows.map((row, index) => (
                    <div key={row.id} className="bg-white rounded-lg border border-blue-200 p-2">
                      {/* Single Row: # | Name | Amount | Category | Remove */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Row number */}
                        <div className="col-span-1 flex justify-center">
                          <span className="text-xs text-gray-500">{index + 1}</span>
                        </div>

                        {/* Item Name */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                            placeholder="Item name"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus={index === 0}
                          />
                        </div>

                        {/* Amount */}
                        <div className="col-span-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-xs text-gray-500">৳</span>
                            <input
                              type="number"
                              value={row.amount}
                              onChange={(e) => handleRowChange(row.id, 'amount', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Category */}
                        <div className="col-span-3">
                          <select
                            value={row.categoryId}
                            onChange={(e) => handleRowChange(row.id, 'categoryId', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove button */}
                        <div className="col-span-1 flex justify-center">
                          {addFormRows.length > 1 && (
                            <button
                              onClick={() => handleRemoveRow(row.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-200">
                    <button
                      onClick={handleAddRow}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add More
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelAdd}
                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAllItems}
                        disabled={submittingItems}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3 h-3" />
                        {submittingItems ? 'Saving...' : 'Save All'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Pending Items */}
              {pendingItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  selected={selectedItems.includes(item.id)}
                  editing={editingItemId === item.id}
                  editFormData={editFormData}
                  categories={categories}
                  onToggle={handleToggleItem}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteItem}
                  onEditFormChange={setEditFormData}
                  getCategoryName={getCategoryName}
                />
              ))}
            </div>
          </div>

          {/* Confirmed Items Section */}
          {confirmedItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">
                  Confirmed ({confirmedItems.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {confirmedItems.map((item) => (
                  <ConfirmedItemRow
                    key={item.id}
                    item={item}
                    onUnconfirm={handleUnconfirmItem}
                    getCategoryName={getCategoryName}
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
          <div className="bg-white rounded-lg max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Confirm Items</h2>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Creating transactions for {selectedItems.length} item(s). 
                Items with same category will be grouped.
              </p>

              {/* Transaction Date */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Account Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Account *
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {accountsWithAvailable.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Avail: ৳{(acc.availableBalance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Selected Items:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-900 truncate">{item.name}</span>
                        <span className="text-gray-600 ml-2">৳{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-sm font-medium">
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
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransaction}
                disabled={confirming}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Delete Item?</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Delete <strong>{showDeleteModal.name}</strong>?
              {showDeleteModal.isConfirmed && (
                <span className="block mt-2 text-red-600">
                  This will also delete the transaction.
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

// Component for Item Row (View/Edit)
function ItemRow({ 
  item, 
  selected, 
  editing, 
  editFormData, 
  categories,
  onToggle, 
  onStartEdit, 
  onCancelEdit,
  onSaveEdit,
  onDelete, 
  onEditFormChange,
  getCategoryName
}) {
  const [showActions, setShowActions] = useState(false);

  if (editing) {
    // Edit Mode - Single Row
    return (
      <div className="p-3 bg-yellow-50 bg-opacity-50">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Checkbox placeholder */}
          <div className="col-span-1"></div>

          {/* Item Name */}
          <div className="col-span-4">
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => onEditFormChange({ ...editFormData, name: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && onSaveEdit(item.id)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Amount */}
          <div className="col-span-3">
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-xs text-gray-500">৳</span>
              <input
                type="number"
                value={editFormData.amount}
                onChange={(e) => onEditFormChange({ ...editFormData, amount: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && onSaveEdit(item.id)}
                step="0.01"
                className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-span-3">
            <select
              value={editFormData.categoryId}
              onChange={(e) => onEditFormChange({ ...editFormData, categoryId: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="col-span-1 flex gap-1 justify-end">
            <button
              onClick={() => onSaveEdit(item.id)}
              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
              title="Save"
            >
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View Mode - Single Row
  return (
    <div 
      className="p-3 hover:bg-gray-50 transition-colors"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Checkbox */}
        <div className="col-span-1 flex justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
          >
            {selected ? (
              <CheckCircle2 className="w-5 h-5 text-gray-900" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Item Name */}
        <div className="col-span-4">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        </div>

        {/* Amount */}
        <div className="col-span-3">
          <p className="text-sm font-semibold text-gray-900">৳{item.amount.toFixed(2)}</p>
        </div>

        {/* Category */}
        <div className="col-span-3">
          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
            {getCategoryName(item.categoryId)}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex gap-1 justify-end">
          {showActions && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(item);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="p-1 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for Confirmed Item Row
function ConfirmedItemRow({ item, onUnconfirm, getCategoryName }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="p-3 bg-green-50 bg-opacity-50"
      onClick={() => setShowActions(!showActions)}
    >
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Checkmark */}
        <div className="col-span-1 flex justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>

        {/* Item Name */}
        <div className="col-span-3">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-green-600"></p>
        </div>

        {/* Amount */}
        <div className="col-span-3">
          <p className="text-sm font-semibold text-gray-900">৳{item.amount.toFixed(2)}</p>
        </div>

        {/* Category */}
        <div className="col-span-4">
          <span className="inline-block px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded">
            {getCategoryName(item.categoryId)}
          </span>
        </div>

        {/* Undo Button */}
        <div className="col-span-1 flex justify-end">
          {showActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnconfirm(item.id);
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 rounded"
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}