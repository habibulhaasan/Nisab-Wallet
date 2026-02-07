// src/app/dashboard/shopping/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getShoppingCarts, 
  addShoppingCart, 
  updateShoppingCart, 
  deleteShoppingCart 
} from '@/lib/shoppingCartCollections';
import { 
  ShoppingBag, Plus, Trash2, Edit, Eye, Package, 
  CheckCircle2, Clock, X 
} from 'lucide-react';

export default function ShoppingListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCart, setEditingCart] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [cartName, setCartName] = useState('');
  const [cartDescription, setCartDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadCarts();
    }
  }, [user]);

  const loadCarts = async () => {
    setLoading(true);
    const result = await getShoppingCarts(user.uid);
    if (result.success) {
      setCarts(result.carts);
    }
    setLoading(false);
  };

  const handleAddCart = () => {
    setCartName('');
    setCartDescription('');
    setEditingCart(null);
    setShowAddModal(true);
  };

  const handleEditCart = (cart) => {
    setCartName(cart.name);
    setCartDescription(cart.description || '');
    setEditingCart(cart);
    setShowAddModal(true);
  };

  const handleSaveCart = async () => {
    if (!cartName.trim()) {
      alert('Please enter a cart name');
      return;
    }

    if (editingCart) {
      // Update existing cart
      const result = await updateShoppingCart(user.uid, editingCart.id, {
        name: cartName,
        description: cartDescription,
      });
      if (result.success) {
        loadCarts();
        setShowAddModal(false);
      } else {
        alert('Failed to update cart');
      }
    } else {
      // Create new cart
      const result = await addShoppingCart(user.uid, {
        name: cartName,
        description: cartDescription,
      });
      if (result.success) {
        loadCarts();
        setShowAddModal(false);
      } else {
        alert('Failed to create cart');
      }
    }
  };

  const handleDeleteCart = async (cart) => {
    setDeleteConfirm(cart);
  };

  const confirmDelete = async () => {
    const result = await deleteShoppingCart(user.uid, deleteConfirm.id);
    if (result.success) {
      loadCarts();
      setDeleteConfirm(null);
    } else {
      alert('Failed to delete cart');
    }
  };

  const handleViewCart = (cart) => {
    router.push(`/dashboard/shopping/${cart.id}`);
  };

  const getStatusBadge = (cart) => {
    if (cart.totalItems === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          <Package className="w-3 h-3" />
          Empty
        </span>
      );
    }
    
    if (cart.confirmedItems === cart.totalItems) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }
    
    if (cart.confirmedItems > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          <Clock className="w-3 h-3" />
          Partial
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
        <Clock className="w-3 h-3" />
        Draft
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Lists</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create shopping carts and track your purchases
            </p>
          </div>
          <button
            onClick={handleAddCart}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Cart</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {carts.length === 0 && (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shopping carts yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first shopping cart to start tracking items
          </p>
          <button
            onClick={handleAddCart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Shopping Cart
          </button>
        </div>
      )}

      {/* Carts Grid */}
      {carts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carts.map((cart) => (
            <div
              key={cart.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Cart Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {cart.name}
                  </h3>
                  {cart.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {cart.description}
                    </p>
                  )}
                </div>
                <div className="ml-2">{getStatusBadge(cart)}</div>
              </div>

              {/* Cart Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{cart.totalItems || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${(cart.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress */}
              {cart.totalItems > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {cart.confirmedItems}/{cart.totalItems}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${cart.totalItems > 0 ? (cart.confirmedItems / cart.totalItems) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewCart(cart)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleEditCart(cart)}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCart(cart)}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCart ? 'Edit Cart' : 'New Shopping Cart'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cart Name *
                </label>
                <input
                  type="text"
                  value={cartName}
                  onChange={(e) => setCartName(e.target.value)}
                  placeholder="e.g., Grocery Shopping"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={cartDescription}
                  onChange={(e) => setCartDescription(e.target.value)}
                  placeholder="Add notes about this shopping cart..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCart}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingCart ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Cart?</h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will remove
              all items in this cart. This action cannot be undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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