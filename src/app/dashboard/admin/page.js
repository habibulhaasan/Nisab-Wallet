// src/app/dashboard/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/adminCheck';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, MessageSquare, TrendingUp, Database, CheckCircle, XCircle, Trash2, Eye, Shield, Calendar, Mail } from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFeedback: 0,
    newFeedback: 0,
    totalTransactions: 0,
  });
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    if (user) {
      if (!isAdmin(user.email)) {
        showToast('Access denied. Admin only.', 'error');
        router.push('/dashboard');
        return;
      }
      loadAdminData();
    }
  }, [user, router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadFeedback(),
        loadUsers(),
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count total users (this is approximate based on feedback)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Count feedback
      const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
      const totalFeedback = feedbackSnapshot.size;
      
      const newFeedbackQuery = query(
        collection(db, 'feedback'),
        where('status', '==', 'new')
      );
      const newFeedbackSnapshot = await getDocs(newFeedbackQuery);
      const newFeedback = newFeedbackSnapshot.size;

      setStats({
        totalUsers,
        totalFeedback,
        newFeedback,
        totalTransactions: 0, // Can be calculated if needed
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFeedback = async () => {
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const feedbackList = [];
      snapshot.forEach((doc) => {
        feedbackList.push({ id: doc.id, ...doc.data() });
      });
      setFeedback(feedbackList);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const markFeedbackAsResolved = async (feedbackId) => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status: 'resolved',
      });
      showToast('Feedback marked as resolved', 'success');
      loadFeedback();
      loadStats();
    } catch (error) {
      showToast('Error updating feedback: ' + error.message, 'error');
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
      showToast('Feedback deleted successfully', 'success');
      loadFeedback();
      loadStats();
      setSelectedFeedback(null);
    } catch (error) {
      showToast('Error deleting feedback: ' + error.message, 'error');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage users, feedback, and application data</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Feedback</p>
            <MessageSquare className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalFeedback}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">New Feedback</p>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-semibold text-orange-600">{stats.newFeedback}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Database</p>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback ({feedback.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users ({users.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('feedback')}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">View Feedback</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Admin Access:</strong> You have full access to all application data. 
                  Use these tools responsibly to manage the platform effectively.
                </p>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No feedback yet</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'new' 
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.status === 'new' ? 'NEW' : 'RESOLVED'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Rating: {'⭐'.repeat(item.rating)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-3 h-3" />
                          <span>{item.userEmail}</span>
                          <span>•</span>
                          <span>{item.userName}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{item.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {item.status === 'new' && (
                          <button
                            onClick={() => markFeedbackAsResolved(item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Mark as resolved"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteFeedback(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Showing {users.length} registered user{users.length !== 1 ? 's' : ''}
                  </p>
                  {users.map((userData) => (
                    <div key={userData.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">User ID: {userData.id}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            This user has accounts, transactions, and other data stored
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/admin/user/${userData.id}`)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}