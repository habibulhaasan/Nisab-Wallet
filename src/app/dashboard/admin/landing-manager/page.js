'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { showToast } from '@/components/Toast';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  Eye,
  Edit2,
  Image as ImageIcon,
  Settings,
  Star
} from 'lucide-react';

export default function AdminLandingManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [features, setFeatures] = useState([]);
  const [heroSection, setHeroSection] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    trustBadge: ''
  });
  const [screenshots, setScreenshots] = useState([]);
  const [satisfactionRating, setSatisfactionRating] = useState(4.9);
  const [transactionDisplayFormat, setTransactionDisplayFormat] = useState('formatted'); // 'formatted' or 'exact'

  useEffect(() => {
    if (user) {
      checkAdminAccess();
      loadContent();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData.role !== 'admin') {
        showToast('Access denied. Admin only.', 'error');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/dashboard');
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'admin', 'landingPageContent');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFeatures(data.features || defaultFeatures);
        setHeroSection(data.heroSection || defaultHeroSection);
        setScreenshots(data.screenshots || []);
        setSatisfactionRating(data.satisfactionRating || 4.9);
        setTransactionDisplayFormat(data.transactionDisplayFormat || 'formatted');
      } else {
        // Initialize with defaults
        setFeatures(defaultFeatures);
        setHeroSection(defaultHeroSection);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      showToast('Error loading content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'admin', 'landingPageContent');
      await setDoc(docRef, {
        features,
        heroSection,
        screenshots,
        satisfactionRating: parseFloat(satisfactionRating),
        transactionDisplayFormat,
        lastUpdated: Timestamp.now(),
        updatedBy: user.uid
      }, { merge: true });
      
      showToast('Landing page content updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving content:', error);
      showToast('Error saving content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, {
      icon: 'Wallet',
      title: 'New Feature',
      description: 'Feature description',
      gradient: 'from-blue-500 to-cyan-500'
    }]);
  };

  const updateFeature = (index, field, value) => {
    const updated = [...features];
    updated[index][field] = value;
    setFeatures(updated);
  };

  const deleteFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const addScreenshot = () => {
    setScreenshots([...screenshots, {
      title: 'New Screenshot',
      description: '',
      imageUrl: ''
    }]);
  };

  const updateScreenshot = (index, field, value) => {
    const updated = [...screenshots];
    updated[index][field] = value;
    setScreenshots(updated);
  };

  const deleteScreenshot = (index) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const defaultFeatures = [
    {
      icon: 'Wallet',
      title: 'Multi-Account Management',
      description: 'Track Cash, Bank, Mobile Wallets in one place',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'TrendingUp',
      title: 'Smart Transaction Tracking',
      description: 'Automatic categorization and insights',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'Shield',
      title: 'Automated Zakat Calculator',
      description: 'Accurate Zakat calculation based on Islamic principles',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'BarChart3',
      title: 'Advanced Analytics',
      description: 'Beautiful charts and spending insights',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: 'Lock',
      title: 'Bank-Grade Security',
      description: 'Military-grade encryption',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: 'Smartphone',
      title: 'Works Everywhere',
      description: 'Responsive design for all devices',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  const defaultHeroSection = {
    title: 'Manage Your Wealth, The Islamic Way',
    subtitle: 'Track • Grow • Purify',
    description: 'Complete financial management with automated Zakat calculation',
    ctaText: 'Start 5-Day Free Trial',
    trustBadge: 'Trusted by 1000+ Users'
  };

  const iconOptions = ['Wallet', 'TrendingUp', 'Shield', 'BarChart3', 'Lock', 'Smartphone', 'Activity', 'Star'];
  const gradientOptions = [
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landing Page Manager</h1>
          <p className="text-gray-600 mt-1">Manage content displayed on the landing page</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={saveContent}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Settings size={20} />
          Statistics Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Satisfaction Rating (out of 5)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={satisfactionRating}
                onChange={(e) => setSatisfactionRating(e.target.value)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(parseFloat(satisfactionRating)) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This rating will be displayed in the stats section. Leave it to calculate automatically from feedback if set to 0.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Count Display Format
            </label>
            <select
              value={transactionDisplayFormat}
              onChange={(e) => setTransactionDisplayFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="formatted">Formatted (e.g., 52.0K+, 1.2M+)</option>
              <option value="exact">Exact Number (e.g., 52,000)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Choose how transaction counts are displayed on the landing page.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Edit2 size={20} />
          Hero Section
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
            <input
              type="text"
              value={heroSection.title}
              onChange={(e) => setHeroSection({ ...heroSection, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Motto)</label>
            <input
              type="text"
              value={heroSection.subtitle}
              onChange={(e) => setHeroSection({ ...heroSection, subtitle: e.target.value })}
              placeholder="e.g., Track • Grow • Purify"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={heroSection.description}
              onChange={(e) => setHeroSection({ ...heroSection, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Button Text</label>
              <input
                type="text"
                value={heroSection.ctaText}
                onChange={(e) => setHeroSection({ ...heroSection, ctaText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trust Badge</label>
              <input
                type="text"
                value={heroSection.trustBadge}
                onChange={(e) => setHeroSection({ ...heroSection, trustBadge: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2 size={20} />
            Features Section
          </h2>
          <button
            onClick={addFeature}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Feature
          </button>
        </div>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Feature {index + 1}</span>
                <button
                  onClick={() => deleteFeature(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={feature.icon}
                    onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gradient</label>
                  <select
                    value={feature.gradient}
                    onChange={(e) => updateFeature(index, 'gradient', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {gradientOptions.map((grad) => (
                      <option key={grad} value={grad}>{grad}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshots Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon size={20} />
            Feature Screenshots
          </h2>
          <button
            onClick={addScreenshot}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Screenshot
          </button>
        </div>

        {screenshots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No screenshots added yet</p>
            <p className="text-sm mt-1">Add feature screenshots to showcase your app</p>
          </div>
        ) : (
          <div className="space-y-4">
            {screenshots.map((screenshot, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Screenshot {index + 1}</span>
                  <button
                    onClick={() => deleteScreenshot(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={screenshot.title}
                    onChange={(e) => updateScreenshot(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={screenshot.description}
                    onChange={(e) => updateScreenshot(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={screenshot.imageUrl}
                      onChange={(e) => updateScreenshot(index, 'imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Changes will be reflected immediately on the landing page after saving.
          User count and transactions are loaded automatically from Firestore, but you can control the satisfaction rating and transaction display format here.
        </p>
      </div>
    </div>
  );
}