// src/app/dashboard/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { checkIsAdmin } from '@/lib/adminUtils';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate } from '@/lib/dateUtils';
import { ToastContainer } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  Users, MessageSquare, TrendingUp, Database, CheckCircle, XCircle, 
  Trash2, Eye, Shield, Calendar, Mail, Star, StickyNote, X, Save
} from 'lucide-react';

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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [editingNotesFor, setEditingNotesFor] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    const adminStatus = await checkIsAdmin(user.uid);
    if (!adminStatus) {
      addToast('Access denied. Admin only.', 'error');
      router.push('/dashboard');
      return;
    }
    loadAdminData();
  };

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
      // Count total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Load all feedback from all users
      let allFeedback = [];
      for (const userDoc of usersSnapshot.docs) {
        const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
        const feedbackSnapshot = await getDocs(feedbackRef);
        feedbackSnapshot.forEach(feedbackDoc => {
          allFeedback.push({
            id: feedbackDoc.id,
            userId: userDoc.id,
            ...feedbackDoc.data()
          });
        });
      }

      const totalFeedback = allFeedback.length;
      const newFeedback = allFeedback.filter(f => f.status === 'new').length;

      setStats({
        totalUsers,
        totalFeedback,
        newFeedback,
        totalTransactions: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFeedback = async () => {
    try {
      const allFeedback = [];
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // For each user, get their feedback
      for (const userDoc of usersSnapshot.docs) {
        const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
        const feedbackSnapshot = await getDocs(query(feedbackRef, orderBy('createdAt', 'desc')));
        
        feedbackSnapshot.forEach(feedbackDoc => {
          allFeedback.push({
            id: feedbackDoc.id,
            userId: userDoc.id,
            ...feedbackDoc.data()
          });
        });
      }
      
      // Sort by creation date (newest first)
      allFeedback.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setFeedback(allFeedback);
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

  const markFeedbackAsResolved = async (userId, feedbackId) => {
    try {
      const feedbackRef = doc(db, 'users', userId, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: user.uid
      });
      addToast('Feedback marked as resolved', 'success');
      loadFeedback();
      loadStats();
    } catch (error) {
      addToast('Error updating feedback: ' + error.message, 'error');
    }
  };

  const toggleFeedbackFeatured = async (userId, feedbackId, currentStatus) => {
    try {
      const feedbackRef = doc(db, 'users', userId, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        featured: !currentStatus,
        featuredAt: !currentStatus ? new Date() : null
      });
      
      addToast(
        !currentStatus ? 'Feedback featured on landing page' : 'Feedback removed from landing page',
        'success'
      );
      loadFeedback();
    } catch (error) {
      addToast('Error updating feedback: ' + error.message, 'error');
    }
  };

  const openNotesModal = (feedbackItem) => {
    setEditingNotesFor(feedbackItem);
    setCurrentNotes(feedbackItem.adminNotes || '');
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    if (!editingNotesFor) return;

    try {
      const feedbackRef = doc(db, 'users', editingNotesFor.userId, 'feedback', editingNotesFor.id);
      await updateDoc(feedbackRef, {
        adminNotes: currentNotes,
        notesUpdatedAt: new Date(),
        notesUpdatedBy: user.uid
      });
      
      addToast('Notes saved successfully', 'success');
      setShowNotesModal(false);
      setEditingNotesFor(null);
      setCurrentNotes('');
      loadFeedback();
    } catch (error) {
      addToast('Error saving notes: ' + error.message, 'error');
    }
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setEditingNotesFor(null);
    setCurrentNotes('');
  };

  const deleteFeedback = (userId, feedbackId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Feedback',
      message: 'Are you sure you want to delete this feedback? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const feedbackRef = doc(db, 'users', userId, 'feedback', feedbackId);
          await deleteDoc(feedbackRef);
          
          setConfirmDialog({ isOpen: false });
          addToast('Feedback deleted successfully', 'success');
          loadFeedback();
          loadStats();
          setSelectedFeedback(null);
        } catch (error) {
          addToast('Error deleting feedback: ' + error.message, 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-7 h-7 mr-2 text-blue-600" />
            Admin Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Feedback</p>
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalFeedback}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">New Feedback</p>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.newFeedback}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Featured</p>
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {feedback.filter(f => f.featured).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback ({feedback.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div key={`${item.userId}-${item.id}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'new' 
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.status === 'new' ? 'NEW' : 'RESOLVED'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {item.type?.toUpperCase() || 'FEEDBACK'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Rating: {'⭐'.repeat(item.rating || 0)}
                          </span>
                          {item.featured && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center">
                              <Star size={12} className="mr-1 fill-current" />
                              Featured
                            </span>
                          )}
                          {item.adminNotes && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center">
                              <StickyNote size={12} className="mr-1" />
                              Has Notes
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-3 h-3" />
                          <span className="break-all">{item.userEmail}</span>
                          <span>•</span>
                          <span>{item.userName}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 break-words">{item.message}</p>
                        {item.adminNotes && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                            <p className="font-medium text-purple-900 mb-1">Admin Notes:</p>
                            <p className="text-purple-700">{item.adminNotes}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center gap-2">
                        {item.status === 'new' && (
                          <button
                            onClick={() => markFeedbackAsResolved(item.userId, item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Mark as resolved"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleFeedbackFeatured(item.userId, item.id, item.featured)}
                          className={`p-2 rounded transition-colors ${
                            item.featured 
                              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title={item.featured ? 'Remove from landing page' : 'Feature on landing page'}
                        >
                          <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => openNotesModal(item)}
                          className={`p-2 rounded transition-colors ${
                            item.adminNotes
                              ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title="Add/Edit notes"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFeedback(item.userId, item.id)}
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">User ID: {userData.id}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            This user has accounts, transactions, and other data stored
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/admin/user/${userData.id}`)}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm whitespace-nowrap"
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

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <StickyNote className="w-5 h-5 mr-2 text-purple-600" />
                Admin Notes
              </h3>
              <button
                onClick={closeNotesModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingNotesFor && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Feedback from:</p>
                <p className="text-sm font-medium text-gray-900">{editingNotesFor.userName}</p>
                <p className="text-sm text-gray-600 mt-1">{editingNotesFor.message}</p>
              </div>
            )}

            <textarea
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Add internal notes for this feedback (only visible to admins)..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm resize-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeNotesModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Notes
              </button>
            </div>
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}