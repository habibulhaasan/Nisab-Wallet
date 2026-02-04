// src/app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Toast from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Nisab Wallet - Islamic Finance & Zakat Tracker',
  description: 'Comprehensive Islamic finance management with intelligent Zakat calculation and monitoring',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}