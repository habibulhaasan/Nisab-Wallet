// src/lib/dateUtils.js

/**
 * Format date to dd/mm/yyyy
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  let d;
  if (date.toDate) {
    // Firestore Timestamp
    d = date.toDate();
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return 'Invalid Date';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format date to dd/mm/yyyy HH:MM
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  let d;
  if (date.toDate) {
    d = date.toDate();
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return 'Invalid Date';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd for input fields
 */
export const toInputDate = (dateString) => {
  if (!dateString) return '';
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Convert yyyy-mm-dd to dd/mm/yyyy
 */
export const fromInputDate = (dateString) => {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Get date range for filters
 */
export const getDateRange = (filter) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  switch (filter) {
    case 'today':
      return {
        start: startOfDay,
        end: endOfDay
      };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday.setHours(0, 0, 0, 0)),
        end: new Date(yesterday.setHours(23, 59, 59, 999))
      };
    
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: new Date(startOfWeek.setHours(0, 0, 0, 0)),
        end: endOfDay
      };
    
    case 'this_month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: startOfMonth,
        end: endOfDay
      };
    
    case 'this_year':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        start: startOfYear,
        end: endOfDay
      };
    
    case 'last_30_days':
      const last30 = new Date(today);
      last30.setDate(today.getDate() - 30);
      return {
        start: new Date(last30.setHours(0, 0, 0, 0)),
        end: endOfDay
      };
    
    default:
      return {
        start: new Date(0), // Beginning of time
        end: endOfDay
      };
  }
};

/**
 * Group transactions by date
 */
export const groupByDate = (transactions) => {
  const grouped = {};
  
  transactions.forEach(transaction => {
    const date = formatDate(transaction.date);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
  });
  
  return grouped;
};