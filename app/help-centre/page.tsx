import React from 'react';

export default function HelpCentrePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Help Centre</h1>
      
      <div className="max-w-3xl mx-auto">
        {/* Search Section */}
        <div className="mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full p-4 border rounded-lg pl-12"
            />
            <svg
              className="absolute left-4 top-4 h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Popular Topics */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Popular Topics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Account Management</h3>
              <p className="text-gray-600">Managing your profile, payments, and settings</p>
            </a>
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Booking Process</h3>
              <p className="text-gray-600">How to book and manage property viewings</p>
            </a>
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Property Listings</h3>
              <p className="text-gray-600">Creating and managing property listings</p>
            </a>
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Payments & Billing</h3>
              <p className="text-gray-600">Understanding payments, fees, and invoices</p>
            </a>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">How do I create an account?</h3>
              <p className="text-gray-600">Click the 'Register' button in the top right corner and follow the instructions.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">How do I reset my password?</h3>
              <p className="text-gray-600">Use the 'Forgot Password' link on the login page to receive reset instructions.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">How do I list a property?</h3>
              <p className="text-gray-600">Go to your dashboard and click 'Add Property' to start the listing process.</p>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Still Need Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg text-center">
              <svg className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Get help via email</p>
              <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
                Contact Support
              </button>
            </div>
            <div className="p-6 border rounded-lg text-center">
              <svg className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our support team</p>
              <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
                Start Chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
