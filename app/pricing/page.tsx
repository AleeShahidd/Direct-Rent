import React from 'react';

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Pricing Plans for Landlords</h1>
      
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {/* Basic Plan */}
        <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold mb-4">Basic</h2>
          <div className="text-4xl font-bold mb-6">
            £49<span className="text-lg font-normal text-gray-600">/month</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Up to 5 listings
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Basic analytics
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Email support
            </li>
          </ul>
          <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">
            Get Started
          </button>
        </div>

        {/* Professional Plan */}
        <div className="border rounded-lg p-8 bg-primary text-white hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold mb-4">Professional</h2>
          <div className="text-4xl font-bold mb-6">
            £99<span className="text-lg font-normal">/month</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Up to 20 listings
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Advanced analytics
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Priority support
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Featured listings
            </li>
          </ul>
          <button className="w-full bg-white text-primary py-2 rounded-lg hover:bg-gray-100">
            Get Started
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold mb-4">Enterprise</h2>
          <div className="text-4xl font-bold mb-6">
            £199<span className="text-lg font-normal text-gray-600">/month</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Unlimited listings
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Custom analytics
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              24/7 support
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              API access
            </li>
          </ul>
          <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark">
            Contact Sales
          </button>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Can I switch plans at any time?</h3>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards and direct bank transfers.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Is there a contract period?</h3>
            <p className="text-gray-600">No, all our plans are month-to-month with no long-term commitment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
