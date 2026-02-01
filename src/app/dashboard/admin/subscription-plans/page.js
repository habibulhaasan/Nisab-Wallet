// src/app/dashboard/admin/subscription-plans/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getSubscriptionPlans, 
  createSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan 
} from '@/lib/subscriptionUtils';
import { checkIsAdmin } from '@/lib/adminUtils';
import { Plus, Edit2, Trash2, Save, X, DollarSign, Calendar, Package, Star, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [formData, setFormData] = useState({
    name: '',
    duration: 'monthly',
    durationDays: 30,
    price: '',
    currency: 'BDT',
    features: '',
    isActive: true,
    isMostPopular: false,
    displayOrder: 0
  });

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    if (!adminStatus) {
      router.push('/dashboard');
      return;
    }
    setIsAdmin(true);
    loadPlans();
  };

  const loadPlans = async () => {
    setLoading(true);
    const result = await getSubscriptionPlans(false); // Get all plans including inactive
    if (result.success) {
      // Sort by displayOrder
      const sortedPlans = result.plans.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setPlans(sortedPlans);
    }
    setLoading(false);
  };

  const handleDurationChange = (duration) => {
    let days = 30;
    if (duration === 'quarterly') days = 90;
    else if (duration === 'half-yearly') days = 180;
    else if (duration === 'yearly') days = 365;
    
    setFormData({
      ...formData,
      duration,
      durationDays: days
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const planData = {
      name: formData.name,
      duration: formData.duration,
      durationDays: parseInt(formData.durationDays),
      price: parseFloat(formData.price),
      currency: formData.currency,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      isActive: formData.isActive,
      isMostPopular: formData.isMostPopular,
      displayOrder: parseInt(formData.displayOrder) || 0
    };

    // If setting as most popular, remove it from other plans
    if (planData.isMostPopular) {
      // This will be handled on the backend or we can do it here
      plans.forEach(async (plan) => {
        if (plan.id !== editingPlan?.id && plan.isMostPopular) {
          await updateSubscriptionPlan(plan.id, { isMostPopular: false });
        }
      });
    }

    let result;
    if (editingPlan) {
      result = await updateSubscriptionPlan(editingPlan.id, planData);
    } else {
      result = await createSubscriptionPlan(planData);
    }

    if (result.success) {
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration: plan.duration,
      durationDays: plan.durationDays,
      price: plan.price.toString(),
      currency: plan.currency,
      features: plan.features?.join(', ') || '',
      isActive: plan.isActive,
      isMostPopular: plan.isMostPopular || false,
      displayOrder: plan.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleDelete = (planId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subscription Plan',
      message: 'Are you sure you want to delete this plan? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        const result = await deleteSubscriptionPlan(planId);
        if (result.success) {
          setConfirmDialog({ isOpen: false });
          loadPlans();
        } else {
          alert('Error: ' + result.error);
        }
      }
    });
  };

  const moveUp = async (index) => {
    if (index === 0) return;
    
    const newPlans = [...plans];
    const temp = newPlans[index - 1].displayOrder;
    
    await updateSubscriptionPlan(newPlans[index].id, { displayOrder: temp });
    await updateSubscriptionPlan(newPlans[index - 1].id, { displayOrder: newPlans[index].displayOrder });
    
    loadPlans();
  };

  const moveDown = async (index) => {
    if (index === plans.length - 1) return;
    
    const newPlans = [...plans];
    const temp = newPlans[index + 1].displayOrder;
    
    await updateSubscriptionPlan(newPlans[index].id, { displayOrder: temp });
    await updateSubscriptionPlan(newPlans[index + 1].id, { displayOrder: newPlans[index].displayOrder });
    
    loadPlans();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 'monthly',
      durationDays: 30,
      price: '',
      currency: 'BDT',
      features: '',
      isActive: true,
      isMostPopular: false,
      displayOrder: plans.length
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans, pricing, and features</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div key={plan.id} className={`bg-white border-2 rounded-lg p-6 relative ${
            plan.isMostPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
          }`}>
            {/* Most Popular Badge */}
            {plan.isMostPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star size={12} className="fill-white" />
                  Most Popular
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 mt-2">
              <Package className={plan.isMostPopular ? "text-blue-600" : "text-gray-600"} size={24} />
              <div className="flex space-x-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === plans.length - 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
            
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold text-gray-900">৳{plan.price}</span>
              <span className="text-gray-500 ml-2">/{plan.duration}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar size={16} className="mr-2" />
                {plan.durationDays} days
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  plan.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Display Order: {plan.displayOrder || 0}
              </div>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Features:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription plans yet</h3>
          <p className="text-gray-500 mb-4">Create your first subscription plan to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Plan
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly Pro, Yearly Premium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Duration Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Display Order (lower numbers appear first)
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Features (comma-separated)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Unlimited transactions, Zakat tracking, Export reports"
                />
              </div>

              <div className="flex items-center space-x-6">
                {/* Is Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>

                {/* Is Most Popular */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMostPopular"
                    checked={formData.isMostPopular}
                    onChange={(e) => setFormData({ ...formData, isMostPopular: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isMostPopular" className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                    <Star size={14} className="text-blue-600" />
                    Mark as Most Popular
                  </label>
                </div>
              </div>

              {formData.isMostPopular && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    ⓘ Only one plan can be "Most Popular" at a time. Setting this will remove the badge from other plans.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save size={16} className="inline mr-2" />
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
    </div>
  );
}