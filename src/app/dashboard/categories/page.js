// src/app/dashboard/categories/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateId } from '@/lib/firestoreCollections';
import { Plus, Edit2, Trash2, FolderOpen, X, Tag, Download, Sparkles } from 'lucide-react';
import { showToast } from '@/components/Toast';

// Default categories data
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'Income', color: '#10B981', isDefault: true },
  { name: 'Bonus', type: 'Income', color: '#3B82F6', isDefault: true },
  { name: 'Loan', type: 'Income', color: '#F59E0B', isDefault: true },
  { name: 'Interest / Riba', type: 'Income', color: '#F59E0B', isDefault: true, isRiba: true },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Transportation', type: 'Expense', color: '#EF4444', isDefault: true },
  { name: 'Shopping', type: 'Expense', color: '#8B5CF6', isDefault: true },
  { name: 'Foods', type: 'Expense', color: '#EC4899', isDefault: true },
  { name: 'Healthcare', type: 'Expense', color: '#06B6D4', isDefault: true },
  { name: 'Loan Payment', type: 'Expense', color: '#F97316', isDefault: true }
];

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Expense',
    color: '#3B82F6',
  });

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#8B5CF6', '#EC4899', '#06B6D4',
    '#84CC16', '#F97316'
  ];

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      const cats = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Failed to load categories', 'error');
    }
    setLoading(false);
  };

  // Load default categories
  const loadDefaultCategories = async () => {
    setLoadingDefaults(true);
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      
      // Get existing category names (case-insensitive, per type)
      const existingNames = categories.reduce((acc, cat) => {
        const key = `${cat.type.toLowerCase()}_${cat.name.toLowerCase().trim()}`;
        acc.add(key);
        return acc;
      }, new Set());
      
      // Combine all default categories
      const allDefaults = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
      
      // Filter out categories that already exist
      const categoriesToAdd = allDefaults.filter(defCat => {
        const key = `${defCat.type.toLowerCase()}_${defCat.name.toLowerCase().trim()}`;
        return !existingNames.has(key);
      });

      if (categoriesToAdd.length === 0) {
        showToast('All default categories already exist', 'info');
        setLoadingDefaults(false);
        return;
      }

      // Add new default categories
      const promises = categoriesToAdd.map(category => 
        addDoc(categoriesRef, {
          categoryId: generateId(),
          ...category,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(promises);
      
      showToast(`Added ${categoriesToAdd.length} default categor${categoriesToAdd.length > 1 ? 'ies' : 'y'}`, 'success');
      await loadCategories();
    } catch (error) {
      console.error('Error loading defaults:', error);
      showToast('Failed to load default categories', 'error');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      showToast('Please enter a category name', 'error');
      return;
    }

    // Check for duplicate names within the same type (case-insensitive, trimmed)
    const trimmedName = formData.name.trim();
    const isDuplicate = categories.some(category => {
      // Skip the current category when editing
      if (editingCategory && category.id === editingCategory.id) {
        return false;
      }
      // Check if same type and same name
      return category.type === formData.type && 
             category.name.toLowerCase().trim() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      showToast(`A ${formData.type.toLowerCase()} category with this name already exists`, 'error');
      return;
    }

    try {
      if (editingCategory) {
        const categoryRef = doc(db, 'users', user.uid, 'categories', editingCategory.id);
        await updateDoc(categoryRef, {
          name: trimmedName,
          type: formData.type,
          color: formData.color,
          updatedAt: serverTimestamp(),
        });
        showToast('Category updated successfully', 'success');
      } else {
        const categoryId = generateId();
        await addDoc(collection(db, 'users', user.uid, 'categories'), {
          categoryId,
          name: trimmedName,
          type: formData.type,
          color: formData.color,
          createdAt: serverTimestamp(),
        });
        showToast('Category added successfully', 'success');
      }
      await loadCategories();
      closeModal();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (confirm(`Delete "${category.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', category.id));
        showToast('Category deleted successfully', 'success');
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

  const incomeCategories = categories.filter(c => c.type === 'Income');
  const expenseCategories = categories.filter(c => c.type === 'Expense');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-sm font-medium">Loading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Load Defaults</span>
              </>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No categories yet</p>
          <p className="text-sm text-gray-400 mb-4">Create categories or load defaults to organize your transactions</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadDefaultCategories}
              disabled={loadingDefaults}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Load Defaults</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Category</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Income Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-green-600" />
              Income Categories ({incomeCategories.length})
            </h2>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No income categories yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {incomeCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors relative">
                    {category.isDefault && (
                      <div className="absolute -top-2 -right-2">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium border border-blue-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Default</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        {category.isRiba && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">RIBA</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleEdit(category)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-red-600" />
              Expense Categories ({expenseCategories.length})
            </h2>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No expense categories yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors relative">
                    {category.isDefault && (
                      <div className="absolute -top-2 -right-2">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium border border-blue-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Default</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleEdit(category)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(category)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  placeholder="e.g., Salary, Groceries"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-full h-10 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
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