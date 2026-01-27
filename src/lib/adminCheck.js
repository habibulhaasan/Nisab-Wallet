// src/lib/adminCheck.js

// List of admin emails - Add your admin emails here
const ADMIN_EMAILS = [
  'nisabwallet@gmail.com',
  'hasanthp@gmail.com', // Replace with your actual email
  // Add more admin emails as needed
];

export const isAdmin = (userEmail) => {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail.toLowerCase());
};

export const ADMIN_EMAILS_LIST = ADMIN_EMAILS;