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
  ShoppingBag, Calendar, AlertCircle, X, Check, ChevronDown
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
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCategory, setItemCategory] = useState('');
  const [itemAccount, setItemAccount] = useState('');
  const [showQuantity, setShowQuantity] = useState(false);

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
      const cats = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddItem = () => {
    setItemName('');
    setItemAmount('');
    setItemQuantity('1');
    setItemCategory('');
    setItemAccount('');
    setShowQuantity(false);
    setEditingItem(null);
    setShowAddItemModal(true);
  };

  const handleEditItem = (item) => {
    setItemName(item.name);
    setItemAmount(item.amount.toString());
    setItemQuantity(item.quantity?.toString() || '1');
    setItemCategory(item.categoryId);
    setItemAccount(item.accountId);
    setShowQuantity(item.quantity && item.quantity > 1);
    setEditingItem(item);
    setShowAddItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      alert('Please enter item name');
      return;
    }
    if (!itemAmount || parseFloat(itemAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }
    if (!itemCategory) {
      alert('Please select a category');
      return;
    }
    if (!itemAccount) {
      alert('Please select an account');
      return;
    }

    const itemData = {
      name: itemName,
      amount: parseFloat(itemAmount),
      quantity: showQuantity ? parseInt(itemQuantity) || 1 : 1,
      categoryId: itemCategory,
      accountId: itemAccount,
    };

    if (editingItem) {
      const result = await updateCartItem(user.uid, cartId, editingItem.id, itemData);
      if (result.success) {
        await loadData();
        setShowAddItemModal(false);
      } else {
        alert('Failed to update item');
      }
    } else {
      const result = await addCartItem(user.uid, cartId, itemData);
      if (result.success) {
        await loadData();
        setShowAddItemModal(false);
      } else {
        alert('Failed to add item');
      }
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
    const category = categories.find((c) => c.categoryId === categoryId);
    return category?.name || 'Unknown';
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.accountId === accountId);
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
    <div className="max-w-4xl mx-auto pb-20">
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
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
          </button>
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
              ${(cart.totalAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Start adding items to your shopping cart
          </p>
          <button
            onClick={handleAddItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Item
          </button>
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-4">
          {/* Pending Items Section */}
          {pendingItems.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Pending Items ({pendingItems.length})
                  </h2>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {selectedItems.length === pendingItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleConfirmItems}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Confirm ({selectedItems.length})
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {pendingItems.map((item) => (
                  <PendingItemRow
                    key={item.id}
                    item={item}
                    selected={selectedItems.includes(item.id)}
                    onToggle={handleToggleItem}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                    getCategoryName={getCategoryName}
                    getAccountName={getAccountName}
                  />
                ))}
              </div>
            </div>
          )}

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

      {/* Add/Edit Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Milk, Bread, Phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={itemAmount}
                    onChange={(e) => setItemAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quantity (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity (optional)
                  </label>
                  <button
                    onClick={() => setShowQuantity(!showQuantity)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {showQuantity ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showQuantity && (
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Account *
                </label>
                <div className="relative">
                  <select
                    value={itemAccount}
                    onChange={(e) => setItemAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.accountId}>
                        {acc.name} (${acc.balance?.toFixed(2) || '0.00'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Info Box */}
              {itemCategory && itemAccount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">
                      Items with the same category and account will be grouped into one transaction when confirmed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                        <span className="text-gray-600">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    $
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

// Component for Pending Item Row
function PendingItemRow({ item, selected, onToggle, onEdit, onDelete, getCategoryName, getAccountName }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className="mt-0.5 flex-shrink-0"
        >
          {selected ? (
            <CheckCircle2 className="w-5 h-5 text-gray-900" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded">{getCategoryName(item.categoryId)}</span>
            <span>•</span>
            <span>{getAccountName(item.accountId)}</span>
            {item.quantity > 1 && (
              <>
                <span>•</span>
                <span>Qty: {item.quantity}</span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">${item.amount.toFixed(2)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
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
  return (
    <div className="p-4 bg-green-50 bg-opacity-50">
      <div className="flex items-start gap-3">
        {/* Checkmark */}
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
              {getCategoryName(item.categoryId)}
            </span>
            <span>•</span>
            <span>{getAccountName(item.accountId)}</span>
            {item.quantity > 1 && (
              <>
                <span>•</span>
                <span>Qty: {item.quantity}</span>
              </>
            )}
          </div>
          <p className="text-xs text-green-600 mt-1">✓ Transaction created</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">${item.amount.toFixed(2)}</p>
        </div>

        {/* Unconfirm Button */}
        <button
          onClick={() => onUnconfirm(item.id)}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
}