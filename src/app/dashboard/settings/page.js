// src/app/dashboard/settings/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { generateId } from '@/lib/firestoreCollections';
import { User, Download, Trash2, AlertTriangle, CheckCircle, FileText, Database, LogOut, Upload, Palette, DollarSign, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const themeContext = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // App preferences
  const [theme, setTheme] = useState(themeContext?.theme || 'light');
  const [currency, setCurrency] = useState('BDT');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [language, setLanguage] = useState(themeContext?.language || 'en');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const snapshot = await getDocs(settingsRef);
      
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.theme) setTheme(data.theme);
          if (data.currency) setCurrency(data.currency);
          if (data.dateFormat) setDateFormat(data.dateFormat);
          if (data.language) setLanguage(data.language);
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const snapshot = await getDocs(settingsRef);
      
      const preferences = {
        theme,
        currency,
        dateFormat,
        language,
        updatedAt: serverTimestamp()
      };

      if (snapshot.empty) {
        await addDoc(settingsRef, preferences);
      } else {
        snapshot.forEach(async (document) => {
          await updateDoc(doc(db, 'users', user.uid, 'settings', document.id), preferences);
        });
      }

      // Apply theme and language directly to localStorage
      localStorage.setItem('theme', theme);
      localStorage.setItem('language', language);
      localStorage.setItem('currency', currency);
      localStorage.setItem('dateFormat', dateFormat);
      
      // Apply theme immediately
      document.documentElement.setAttribute('data-theme', theme);
      
      if (themeContext?.updateTheme) {
        themeContext.updateTheme(theme);
      }
      
      if (themeContext?.updateLanguage) {
        themeContext.updateLanguage(language);
      }

      alert('Preferences saved successfully! Refreshing page...');
      
      // Refresh to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert('Error saving preferences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Export All Data
  const handleExportAllData = async () => {
    setLoading(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          displayName: user.displayName,
        },
        accounts: [],
        transactions: [],
        categories: [],
        transfers: [],
        zakatCycles: [],
        settings: []
      };

      const collections = ['accounts', 'transactions', 'categories', 'transfers', 'zakatCycles', 'settings'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, 'users', user.uid, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.forEach((doc) => {
          data[collectionName].push({ id: doc.id, ...doc.data() });
        });
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `h-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      alert('Error exporting data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Import Data
  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file');
      return;
    }

    if (!confirm('This will add the imported data to your existing data. Continue?')) {
      e.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.accounts && !data.transactions && !data.categories) {
        throw new Error('Invalid backup file format');
      }

      let imported = { accounts: 0, transactions: 0, categories: 0, transfers: 0 };

      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          const accountId = generateId();
          await addDoc(collection(db, 'users', user.uid, 'accounts'), {
            ...account,
            accountId,
            createdAt: serverTimestamp(),
          });
          imported.accounts++;
        }
      }

      if (data.categories && Array.isArray(data.categories)) {
        for (const category of data.categories) {
          const categoryId = generateId();
          await addDoc(collection(db, 'users', user.uid, 'categories'), {
            ...category,
            categoryId,
            createdAt: serverTimestamp(),
          });
          imported.categories++;
        }
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          const transactionId = generateId();
          await addDoc(collection(db, 'users', user.uid, 'transactions'), {
            ...transaction,
            transactionId,
            createdAt: serverTimestamp(),
          });
          imported.transactions++;
        }
      }

      if (data.transfers && Array.isArray(data.transfers)) {
        for (const transfer of data.transfers) {
          const transferId = generateId();
          await addDoc(collection(db, 'users', user.uid, 'transfers'), {
            ...transfer,
            transferId,
            createdAt: serverTimestamp(),
          });
          imported.transfers++;
        }
      }

      alert(`Data imported successfully!\nAccounts: ${imported.accounts}\nCategories: ${imported.categories}\nTransactions: ${imported.transactions}\nTransfers: ${imported.transfers}`);
      
      window.location.reload();
    } catch (error) {
      alert('Error importing data: ' + error.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  // Export Transactions CSV
  const handleExportTransactionsCSV = async () => {
    setLoading(true);
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      
      const transactions = [];
      snapshot.forEach((doc) => {
        transactions.push(doc.data());
      });

      if (transactions.length === 0) {
        alert('No transactions to export');
        setLoading(false);
        return;
      }

      const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description'];
      const rows = transactions.map(t => [
        t.date,
        t.type,
        t.amount,
        t.accountId,
        t.categoryId,
        t.description || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Transactions exported successfully!');
    } catch (error) {
      alert('Error exporting transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Export Accounts CSV
  const handleExportAccountsCSV = async () => {
    setLoading(true);
    try {
      const accountsRef = collection(db, 'users', user.uid, 'accounts');
      const snapshot = await getDocs(accountsRef);
      
      const accounts = [];
      snapshot.forEach((doc) => {
        accounts.push(doc.data());
      });

      if (accounts.length === 0) {
        alert('No accounts to export');
        setLoading(false);
        return;
      }

      const headers = ['Name', 'Type', 'Balance'];
      const rows = accounts.map(a => [
        a.name,
        a.type,
        a.balance
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Accounts exported successfully!');
    } catch (error) {
      alert('Error exporting accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Wallet Data Only
  const handleDeleteWalletData = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!confirm('This will permanently delete all your wallet data. Your login account will remain active. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const collections = ['accounts', 'transactions', 'categories', 'transfers', 'zakatCycles', 'settings'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, 'users', user.uid, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        const deletePromises = [];
        snapshot.forEach((document) => {
          deletePromises.push(deleteDoc(doc(db, 'users', user.uid, collectionName, document.id)));
        });
        
        await Promise.all(deletePromises);
      }
      
      alert('All wallet data deleted successfully! Your login account is still active.');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      
      window.location.reload();
    } catch (error) {
      alert('Error deleting data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              placeholder="Your name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">App Preferences</h2>
        </div>

        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              <span>Theme</span>
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Currency</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name} ({curr.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Currency display preference (conversion not included)
            </p>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>

          <button
            onClick={savePreferences}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Import Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-file"
              disabled={loading}
            />
            <label
              htmlFor="import-file"
              className="cursor-pointer"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload backup file
              </p>
              <p className="text-xs text-gray-500">
                JSON files only. Your data will be added to existing data.
              </p>
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">Import Information</p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>• Only import files exported from H Wallet</li>
                  <li>• Imported data will be added to your existing data</li>
                  <li>• Duplicate entries may be created</li>
                  <li>• We recommend backing up your current data first</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Download className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportAllData}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Export All Data (JSON)</p>
                <p className="text-xs text-gray-500">Complete backup of all your data</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handleExportTransactionsCSV}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Export Transactions (CSV)</p>
                <p className="text-xs text-gray-500">Download transaction history as spreadsheet</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handleExportAccountsCSV}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Export Accounts (CSV)</p>
                <p className="text-xs text-gray-500">Download account list as spreadsheet</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Version</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">User ID</span>
            <span className="font-mono text-xs text-gray-900">{user?.uid.slice(0, 20)}...</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Account Created</span>
            <span className="font-medium text-gray-900">
              {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              <strong>Warning:</strong> This will permanently delete all your wallet data including:
            </p>
            <ul className="text-xs text-red-700 space-y-1 mb-3 ml-4">
              <li>• All accounts (Cash, Bank, Mobile Banking, Gold, Silver)</li>
              <li>• All transactions (Income & Expenses)</li>
              <li>• All categories</li>
              <li>• All transfers</li>
              <li>• All Zakat records and cycles</li>
              <li>• All preferences and settings</li>
            </ul>
            <p className="text-xs text-red-700">
              <strong>Note:</strong> Your login account (email & password) will remain active. You can start using H Wallet again without registering.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Export your data before deletion if you want to keep a backup.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Wallet Data</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={async () => {
            await logout();
            router.push('/');
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Delete All Wallet Data</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will permanently delete all your wallet data. Your login account will remain active so you can start fresh.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ This action cannot be undone. Make sure you've exported your data if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  placeholder="Type DELETE"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWalletData}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}