// src/app/page.js (or wherever your landing page is)
'use client';

import { useState } from 'react';
import { Star, Wallet, CreditCard, TrendingUp, TrendingDown, Clock, CheckCircle2, Calendar, ArrowRight, Plus, ArrowRightLeft, FileText, Receipt } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle subscription logic here (e.g., redirect to signup or integrate with payment)
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image 
              src="/nisab-logo.png" // Replace with your actual logo path
              alt="Nisab Wallet"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold text-gray-900">Nisab Wallet</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
            <a href="#zakat" className="text-sm font-medium text-gray-600 hover:text-gray-900">Zakat Tools</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#about" className="text-sm font-medium text-gray-600 hover:text-gray-900">About</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/login')} className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</button>
            <button 
              onClick={() => router.push('/signup')} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Manage Your Wealth <span className="text-emerald-600">the Halal Way</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track nisab thresholds, calculate zakat accurately, and manage your finances in full compliance with Shariah principles. Secure, intuitive, and built for the modern Muslim.
        </p>
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <button 
            onClick={() => router.push('/signup')} 
            className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-white border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Powerful Features for Halal Wealth Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <Wallet className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Account Tracking</h3>
              <p className="text-gray-600">Manage all your accounts in one place with real-time balances and summaries.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <TrendingUp className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Income & Expense Insights</h3>
              <p className="text-gray-600">Track monthly flows with intuitive visualizations and reports.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <CreditCard className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Transactions</h3>
              <p className="text-gray-600">Add, transfer, and monitor transactions with bank-grade security.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
              <FileText className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Reporting</h3>
              <p className="text-gray-600">Generate detailed financial reports for better decision-making.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Zakat Section */}
      <section id="zakat" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Intelligent Zakat Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Real-Time Nisab Tracking</h3>
                </div>
                <p className="text-gray-600">Automatic updates based on gold/silver values. Know exactly when zakat becomes due.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Hijri Cycle Monitoring</h3>
                </div>
                <p className="text-gray-600">Track your hawl with precise Hijri date calculations and reminders.</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Accurate Zakat Calculation</h3>
                </div>
                <p className="text-gray-600">2.5% on eligible assets with one-click payment options to charities.</p>
              </div>
            </div>
            <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Zakat Status Overview</h3>
              <p className="text-gray-600 mb-6">Get instant insights into your zakat obligations.</p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Total Wealth</span>
                  <span className="font-semibold">৳1,000,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nisab Threshold</span>
                  <span className="font-semibold">৳500,000</span>
                </div>
                <div className="h-2 bg-white rounded-full">
                  <div className="w-3/4 h-full bg-emerald-500 rounded-full"></div>
                </div>
                <div className="text-center text-emerald-600 font-medium">Monitoring Active - 120 days remaining</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
              <p className="text-gray-600 mb-6">Free forever</p>
              <p className="text-4xl font-bold text-gray-900 mb-8">$0<span className="text-xl text-gray-500">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Basic Tracking</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Nisab Monitoring</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Limited Reports</span></li>
              </ul>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Get Started</button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-emerald-600 relative">
              <span className="absolute top-0 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium -translate-y-1/2">Popular</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-6">Advanced features</p>
              <p className="text-4xl font-bold text-gray-900 mb-8">$9.99<span className="text-xl text-gray-500">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Full Zakat Tools</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Unlimited Accounts</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Premium Reports</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Priority Support</span></li>
              </ul>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Subscribe Now</button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For businesses</p>
              <p className="text-4xl font-bold text-gray-900 mb-8">Custom</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>All Pro Features</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Team Management</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>API Access</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span>Dedicated Support</span></li>
              </ul>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-emerald-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Financial Journey?</h2>
          <p className="text-lg mb-8">Join thousands of users managing their wealth with peace of mind.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none"
              required
            />
            <button type="submit" className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Subscribe <ArrowRight className="inline w-4 h-4 ml-2" />
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm border-t border-gray-800 pt-8">
            © 2026 Nisab Wallet. All rights reserved. Built for the Ummah.
          </div>
        </div>
      </footer>
    </div>
  );
}