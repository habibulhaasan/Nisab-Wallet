// src/lib/shoppingCartCollections.js
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// SHOPPING CARTS CRUD Operations
// ============================================

export const shoppingCartsCollection = (userId) => collection(db, 'users', userId, 'shoppingCarts');

// Create Shopping Cart
export const addShoppingCart = async (userId, cartData) => {
  try {
    const cartId = generateId();
    const docRef = await addDoc(shoppingCartsCollection(userId), {
      ...cartData,
      cartId,
      status: 'draft', // draft, completed
      totalAmount: 0,
      totalItems: 0,
      confirmedItems: 0,
      pendingItems: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, cartId };
  } catch (error) {
    console.error('Error adding shopping cart:', error);
    return { success: false, error: error.message };
  }
};

// Get all Shopping Carts
export const getShoppingCarts = async (userId) => {
  try {
    const q = query(shoppingCartsCollection(userId));
    const querySnapshot = await getDocs(q);
    const carts = [];
    querySnapshot.forEach((doc) => {
      carts.push({ id: doc.id, ...doc.data() });
    });
    // Sort by most recent first
    carts.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });
    return { success: true, carts };
  } catch (error) {
    console.error('Error getting shopping carts:', error);
    return { success: false, error: error.message, carts: [] };
  }
};

// Get single Shopping Cart
export const getShoppingCart = async (userId, cartDocId) => {
  try {
    const cartRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId);
    const cartDoc = await getDoc(cartRef);
    if (cartDoc.exists()) {
      return { success: true, cart: { id: cartDoc.id, ...cartDoc.data() } };
    } else {
      return { success: false, error: 'Cart not found' };
    }
  } catch (error) {
    console.error('Error getting shopping cart:', error);
    return { success: false, error: error.message };
  }
};

// Update Shopping Cart
export const updateShoppingCart = async (userId, cartDocId, cartData) => {
  try {
    const cartRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId);
    await updateDoc(cartRef, {
      ...cartData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating shopping cart:', error);
    return { success: false, error: error.message };
  }
};

// Delete Shopping Cart (and all its items)
export const deleteShoppingCart = async (userId, cartDocId) => {
  try {
    const batch = writeBatch(db);
    
    // Delete all items in the cart
    const itemsRef = collection(db, 'users', userId, 'shoppingCarts', cartDocId, 'items');
    const itemsSnapshot = await getDocs(itemsRef);
    itemsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the cart itself
    const cartRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId);
    batch.delete(cartRef);
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error deleting shopping cart:', error);
    return { success: false, error: error.message };
  }
};

// Recalculate cart totals based on items
export const recalculateCartTotals = async (userId, cartDocId) => {
  try {
    const items = await getCartItems(userId, cartDocId);
    if (!items.success) return items;
    
    const totalAmount = items.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalItems = items.items.length;
    const confirmedItems = items.items.filter(item => item.isConfirmed).length;
    const pendingItems = items.items.filter(item => !item.isConfirmed).length;
    
    await updateShoppingCart(userId, cartDocId, {
      totalAmount,
      totalItems,
      confirmedItems,
      pendingItems,
    });
    
    return { success: true, totalAmount, totalItems, confirmedItems, pendingItems };
  } catch (error) {
    console.error('Error recalculating cart totals:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SHOPPING CART ITEMS CRUD Operations
// ============================================

export const cartItemsCollection = (userId, cartDocId) => 
  collection(db, 'users', userId, 'shoppingCarts', cartDocId, 'items');

// Add Item to Cart
export const addCartItem = async (userId, cartDocId, itemData) => {
  try {
    const itemId = generateId();
    const docRef = await addDoc(cartItemsCollection(userId, cartDocId), {
      ...itemData,
      itemId,
      amount: parseFloat(itemData.amount) || 0,
      quantity: parseInt(itemData.quantity) || 1,
      isConfirmed: false,
      transactionId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Recalculate cart totals
    await recalculateCartTotals(userId, cartDocId);
    
    return { success: true, id: docRef.id, itemId };
  } catch (error) {
    console.error('Error adding cart item:', error);
    return { success: false, error: error.message };
  }
};

// Get all Items in a Cart
export const getCartItems = async (userId, cartDocId) => {
  try {
    const q = query(cartItemsCollection(userId, cartDocId));
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    // Sort by creation date
    items.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeA - timeB;
    });
    return { success: true, items };
  } catch (error) {
    console.error('Error getting cart items:', error);
    return { success: false, error: error.message, items: [] };
  }
};

// Update Cart Item
export const updateCartItem = async (userId, cartDocId, itemDocId, itemData) => {
  try {
    const itemRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId, 'items', itemDocId);
    await updateDoc(itemRef, {
      ...itemData,
      amount: parseFloat(itemData.amount) || 0,
      updatedAt: serverTimestamp(),
    });
    
    // Recalculate cart totals
    await recalculateCartTotals(userId, cartDocId);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error: error.message };
  }
};

// Delete Cart Item
export const deleteCartItem = async (userId, cartDocId, itemDocId, transactionId = null) => {
  try {
    const batch = writeBatch(db);
    
    // Delete the item
    const itemRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId, 'items', itemDocId);
    batch.delete(itemRef);
    
    // If item was confirmed, delete the associated transaction
    if (transactionId) {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transQuery = query(transactionsRef, where('transactionId', '==', transactionId));
      const transSnapshot = await getDocs(transQuery);
      transSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    
    // Recalculate cart totals
    await recalculateCartTotals(userId, cartDocId);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// TRANSACTION CREATION FROM CART ITEMS
// ============================================

// Group items by account and category for transaction creation
export const groupItemsForTransactions = (items) => {
  const groups = {};
  
  items.forEach(item => {
    if (item.isConfirmed) return; // Skip already confirmed items
    
    const key = `${item.accountId}_${item.categoryId}`;
    if (!groups[key]) {
      groups[key] = {
        accountId: item.accountId,
        categoryId: item.categoryId,
        items: [],
        totalAmount: 0,
      };
    }
    
    groups[key].items.push(item);
    groups[key].totalAmount += parseFloat(item.amount) || 0;
  });
  
  return Object.values(groups);
};

// Create transactions from cart items
export const confirmCartItems = async (userId, cartDocId, selectedItemIds, transactionDate) => {
  try {
    const batch = writeBatch(db);
    
    // Get all items
    const itemsResult = await getCartItems(userId, cartDocId);
    if (!itemsResult.success) throw new Error('Failed to fetch cart items');
    
    // Filter selected items
    const selectedItems = itemsResult.items.filter(item => 
      selectedItemIds.includes(item.id) && !item.isConfirmed
    );
    
    if (selectedItems.length === 0) {
      return { success: false, error: 'No valid items to confirm' };
    }
    
    // Group items by account + category
    const transactionGroups = groupItemsForTransactions(selectedItems);
    
    const createdTransactions = [];
    
    // Create transactions for each group
    for (const group of transactionGroups) {
      const transactionId = generateId();
      const itemNames = group.items.map(item => item.name).join(', ');
      
      // Create transaction
      const transactionRef = doc(collection(db, 'users', userId, 'transactions'));
      batch.set(transactionRef, {
        transactionId,
        type: 'expense',
        amount: group.totalAmount,
        accountId: group.accountId,
        categoryId: group.categoryId,
        date: transactionDate,
        notes: `Shopping: ${itemNames}`,
        createdAt: serverTimestamp(),
      });
      
      createdTransactions.push(transactionId);
      
      // Update each item in this group
      for (const item of group.items) {
        const itemRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId, 'items', item.id);
        batch.update(itemRef, {
          isConfirmed: true,
          transactionId,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    await batch.commit();
    
    // Recalculate cart totals
    await recalculateCartTotals(userId, cartDocId);
    
    return { 
      success: true, 
      transactionCount: createdTransactions.length,
      transactionIds: createdTransactions 
    };
  } catch (error) {
    console.error('Error confirming cart items:', error);
    return { success: false, error: error.message };
  }
};

// Unconfirm items (delete transactions and mark items as pending)
export const unconfirmCartItems = async (userId, cartDocId, itemIds) => {
  try {
    const batch = writeBatch(db);
    
    // Get items to unconfirm
    const itemsResult = await getCartItems(userId, cartDocId);
    if (!itemsResult.success) throw new Error('Failed to fetch cart items');
    
    const itemsToUnconfirm = itemsResult.items.filter(item => itemIds.includes(item.id) && item.isConfirmed);
    
    // Collect transaction IDs to delete
    const transactionIdsToDelete = [...new Set(itemsToUnconfirm.map(item => item.transactionId).filter(Boolean))];
    
    // Delete transactions
    for (const transId of transactionIdsToDelete) {
      const transQuery = query(
        collection(db, 'users', userId, 'transactions'),
        where('transactionId', '==', transId)
      );
      const transSnapshot = await getDocs(transQuery);
      transSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    // Update items to unconfirmed
    for (const item of itemsToUnconfirm) {
      const itemRef = doc(db, 'users', userId, 'shoppingCarts', cartDocId, 'items', item.id);
      batch.update(itemRef, {
        isConfirmed: false,
        transactionId: null,
        confirmedAt: null,
        updatedAt: serverTimestamp(),
      });
    }
    
    await batch.commit();
    
    // Recalculate cart totals
    await recalculateCartTotals(userId, cartDocId);
    
    return { success: true };
  } catch (error) {
    console.error('Error unconfirming cart items:', error);
    return { success: false, error: error.message };
  }
};