// src/lib/publicFeedback.js
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get public/featured feedback for displaying on landing page
 * Only shows resolved feedback with 4+ stars
 */
export const getPublicFeedback = async (limitCount = 6) => {
  try {
    const feedbackList = [];
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Loop through users and get their feedback
    for (const userDoc of usersSnapshot.docs) {
      const feedbackRef = collection(db, 'users', userDoc.id, 'feedback');
      const feedbackSnapshot = await getDocs(feedbackRef);
      
      feedbackSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include resolved feedback with rating >= 4
        if (data.status === 'resolved' && data.rating >= 4) {
          feedbackList.push({
            id: doc.id,
            userId: userDoc.id,
            ...data
          });
        }
      });
    }
    
    // Sort by rating (highest first), then by date (newest first)
    feedbackList.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    
    // Return limited results
    return {
      success: true,
      feedback: feedbackList.slice(0, limitCount)
    };
  } catch (error) {
    console.error('Error getting public feedback:', error);
    return {
      success: false,
      error: error.message,
      feedback: []
    };
  }
};