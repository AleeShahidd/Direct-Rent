import React from 'react';

export default function PressPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Press &amp; Media</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Latest Press Releases</h2>
          <div className="space-y-8">
            <div className="border-b pb-6">
              <p className="text-sm text-gray-500">July 10, 2025</p>
              <h3 className="text-xl font-semibold mb-2">
                DirectRent UK Launches Revolutionary AI-Powered Property Matching
              </h3>
              <p className="text-gray-600 mb-4">
                New feature uses machine learning to match tenants with their ideal properties...
              </p>
              <a href="#" className="text-primary hover:underline">Read More</a>
            </div>

            <div className="border-b pb-6">
              <p className="text-sm text-gray-500">June 15, 2025</p>
              <h3 className="text-xl font-semibold mb-2">
                DirectRent UK Expands to Scotland
              </h3>
              <p className="text-gray-600 mb-4">
                Following successful operations in England and Wales, DirectRent UK announces expansion...
              </p>
              <a href="#" className="text-primary hover:underline">Read More</a>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Media Kit</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Company Logos</h3>
              <p className="mb-4">Download our brand assets in various formats.</p>
              <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
                Download Logos
              </button>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Media Information</h3>
              <p className="mb-4">Access our press kit and company information.</p>
              <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
                Download Press Kit
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Media Contact</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-2"><strong>Press Enquiries:</strong></p>
            <p className="mb-2">press@directrent.uk</p>
            <p className="mb-2">+44 (0)20 1234 5678</p>
          </div>
        </section>
      </div>
    </div>
  );
}
