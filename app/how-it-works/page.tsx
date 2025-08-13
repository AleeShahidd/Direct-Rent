import React from 'react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">How DirectRent Works</h1>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold text-primary mb-4">1</div>
          <h3 className="text-xl font-semibold mb-4">Search &amp; Find</h3>
          <p className="text-gray-600">
            Browse through our extensive property listings with detailed filters to find your perfect match.
          </p>
        </div>

        <div className="text-center p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold text-primary mb-4">2</div>
          <h3 className="text-xl font-semibold mb-4">Book Viewings</h3>
          <p className="text-gray-600">
            Schedule property viewings directly through our platform at your convenience.
          </p>
        </div>

        <div className="text-center p-6 rounded-lg shadow-lg">
          <div className="text-3xl font-bold text-primary mb-4">3</div>
          <h3 className="text-xl font-semibold mb-4">Secure Your Property</h3>
          <p className="text-gray-600">
            Complete the rental process online with our secure platform and move into your new home.
          </p>
        </div>
      </div>

      <div className="prose lg:prose-lg mx-auto">
        <h2 className="text-2xl font-semibold mb-4">For Tenants</h2>
        <p className="mb-6">
          Finding and renting your perfect property has never been easier. Our platform provides
          a seamless experience from search to signing your tenancy agreement.
        </p>

        <h2 className="text-2xl font-semibold mb-4">For Landlords</h2>
        <p className="mb-6">
          List your property, manage viewings, and find reliable tenants all in one place.
          Our platform handles the heavy lifting so you can focus on what matters.
        </p>
      </div>
    </div>
  );
}
