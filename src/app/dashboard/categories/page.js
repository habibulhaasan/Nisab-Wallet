// src/app/dashboard/categories/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';
import { Plus, Edit2, Trash2, FolderOpen, X, Tag, Download, Sparkles, Lock } from 'lucide-react';
import { showToast } from '@/components/Toast';

// ─── System categories (must match defaultData.js exactly) ───────────────────
// These are loaded via the "Load Defaults" button and are protected from deletion.
const SYSTEM_INCOME_CATEGORIES = [
  { name: 'Salary',               type: 'Income',  color: '#10B981', isSystem: true, isDefault: true },
  { name: 'Business Income',      type: 'Income',  color: '#3B82F6', isSystem: true, isDefault: true },
  { name: 'Interest / Riba',      type: 'Income',  color: '#F59E0B', isSystem: true, isDefault: true, isRiba: true },
  { name: 'Jewellery Redemption', type: 'Income',  color: '#F59E0B', isSystem: true, isDefault: true },
  { name: 'Investment Return',    type: 'Income',  color: '#06B6D4', isSystem: true, isDefault: true },
  { name: 'Loan Received',        type: 'Income',  color: '#8B5CF6', isSystem: true, isDefault: true },
  { name: 'Lending Received',     type: 'Income',  color: '#84CC16', isSystem: true, isDefault: true },
];

const SYSTEM_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',     type: 'Expense', color: '#EC4899', isSystem: true, isDefault: true },
  { name: 'Transport',         type: 'Expense', color: '#EF4444', isSystem: true, isDefault: true },
  { name: 'Bills & Utilities', type: 'Expense', color: '#6366F1', isSystem: true, isDefault: true },
  { name: 'Fees & Charges',    type: 'Expense', color: '#F97316', isSystem: true, isDefault: true },
  { name: 'Zakat Payment',     type: 'Expense', color: '#10B981', isSystem: true, isDefault: true },
  { name: 'Sadaqah / Charity', type: 'Expense', color: '#06B6D4', isSystem: true, isDefault: true },
  { name: 'Loan Repayment',    type: 'Expense', color: '#F59E0B', isSystem: true, isDefault: true },
];

// Regular defaults (deletable)
const DEFAULT_INCOME_CATEGORIES  = [
  { name: 'Bonus',      type: 'Income',  color: '#3B82F6', isDefault: true },
];
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Shopping',   type: 'Expense', color: '#8B5CF6', isDefault: true },
  { name: 'Healthcare', type: 'Expense', color: '#06B6D4', isDefault: true },
];

const ALL_DEFAULTS = [
  ...SYSTEM_INCOME_CATEGORIES,
  ...SYSTEM_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [showModal,       setShowModal]       = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData,        setFormData]        = useState({ name: '', type: 'Expense', color: '#3B82F6' });

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#06B6D4',
    '#84CC16', '#F97316',
  ];

  useEffect(() => { if (user) loadCategories(); }, [user]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'categories'));
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      showToast('Failed to load categories', 'error');
    }
    setLoading(false);
  };

  // ── Load / restore defaults ────────────────────────────────────────────────
  const loadDefaultCategories = async () => {
    setLoadingDefaults(true);
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');

      // Build dedup key set from current categories
      const existingKeys = new Set(
        categories.map(c => `${c.type.toLowerCase()}_${c.name.toLowerCase().trim()}`)
      );

      const toAdd = ALL_DEFAULTS.filter(cat => {
        const key = `${cat.type.toLowerCase()}_${cat.name.toLowerCase().trim()}`;
        return !existingKeys.has(key);
      });

      if (toAdd.length === 0) {
        showToast('All default categories already exist', 'info');
        setLoadingDefaults(false);
        return;
      }

      await Promise.all(
        toAdd.map(cat =>
          addDoc(categoriesRef, {
            categoryId: generateId(),
            ...cat,
            createdAt: serverTimestamp(),
          })
        )
      );

      showToast(`Added ${toAdd.length} categor${toAdd.length > 1 ? 'ies' : 'y'}`, 'success');
      await loadCategories();
    } catch (error) {
      showToast('Failed to load default categories', 'error');
    } finally {
      setLoadingDefaults(false);
    }
  };

  // ── Add / Edit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) { showToast('Please enter a category name', 'error'); return; }

    const isDuplicate = categories.some(c => {
      if (editingCategory && c.id === editingCategory.id) return false;
      return c.type === formData.type && c.name.toLowerCase().trim() === trimmedName.toLowerCase();
    });
    if (isDuplicate) {
      showToast(`A ${formData.type.toLowerCase()} category with this name already exists`, 'error');
      return;
    }

    // Auto-set isRiba for interest/riba named categories
    const isRiba = /^(interest|riba)$/i.test(trimmedName);

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'users', user.uid, 'categories', editingCategory.id), {
          name: trimmedName, type: formData.type, color: formData.color,
          isRiba: editingCategory.isRiba || isRiba,
          updatedAt: serverTimestamp(),
        });
        showToast('Category updated', 'success');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'categories'), {
          categoryId: generateId(),
          name: trimmedName, type: formData.type, color: formData.color,
          isRiba,
          createdAt: serverTimestamp(),
        });
        showToast('Category added', 'success');
      }
      await loadCategories();
      closeModal();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const handleEdit = (category) => {
    // System categories: allow color edit only
    setEditingCategory(category);
    setFormData({ name: category.name, type: category.type, color: category.color });
    setShowModal(true);
  };

  // ── Delete — system categories are protected ───────────────────────────────
  const handleDelete = async (category) => {
    if (category.isSystem) {
      showToast(`"${category.name}" is a system category and cannot be deleted.`, 'error');
      return;
    }
    if (confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', category.id));
        showToast('Category deleted', 'success');
        await loadCategories();
      } catch (error) {
        showToast('Error: ' + error.message, 'error');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', type: 'Expense', color: '#3B82F6' });
  };

  const incomeCategories  = categories.filter(c => c.type === 'Income');
  const expenseCategories = categories.filter(c => c.type === 'Expense');

  // ── Category card ──────────────────────────────────────────────────────────
  const CategoryCard = ({ category }) => (
    <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors relative ${
      category.isSystem ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Badge */}
      <div className="absolute -top-2 -right-2">
        {category.isSystem ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-300">
            <Lock className="w-2.5 h-2.5" />
            <span>System</span>
          </div>
        ) : category.isDefault ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium border border-blue-200">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Default</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
        </div>
        <div>
          <span className="text-sm font-medium text-gray-900">{category.name}</span>
          {category.isRiba && (
            <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-full">⚠ RIBA</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleEdit(category)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          title={category.isSystem ? 'Edit color' : 'Edit'}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(category)}
          className={`p-1.5 rounded transition-colors ${
            category.isSystem
              ? 'text-gray-200 cursor-not-allowed'
              : 'text-gray-400 hover:text-red-600'
          }`}
          title={category.isSystem ? 'System categories cannot be deleted' : 'Delete'}
          disabled={category.isSystem}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDefaultCategories}
            disabled={loadingDefaults}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingDefaults ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span className="text-sm font-medium">Loading...</span></>
            ) : (
              <><Download className="w-4 h-4" /><span className="text-sm font-medium">Load Defaults</span></>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Category</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300">
            <Lock className="w-2.5 h-2.5" /><span className="text-[10px] font-semibold">System</span>
          </div>
          <span>Required by app features — cannot be deleted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
            <Sparkles className="w-2.5 h-2.5" /><span className="text-[10px] font-medium">Default</span>
          </div>
          <span>Pre-loaded, can be deleted</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No categories yet</p>
          <p className="text-sm text-gray-400 mb-4">Load defaults to get started with all required categories</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadDefaultCategories} disabled={loadingDefaults}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Download className="w-4 h-4" /><span className="text-sm">Load Defaults</span>
            </button>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
              <Plus className="w-4 h-4" /><span className="text-sm">Add Category</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Income */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-green-600" />
              Income Categories ({incomeCategories.length})
            </h2>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No income categories yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {incomeCategories.map(c => <CategoryCard key={c.id} category={c} />)}
              </div>
            )}
          </div>

          {/* Expense */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-red-600" />
              Expense Categories ({expenseCategories.length})
            </h2>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No expense categories yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {expenseCategories.map(c => <CategoryCard key={c.id} category={c} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* System category note */}
            {editingCategory?.isSystem && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800">
                  This is a system category. You can change the colour but not the name or type.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={editingCategory?.isSystem}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="e.g., Salary, Groceries"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  disabled={editingCategory?.isSystem}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map(color => (
                    <button key={color} type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-full h-10 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}