import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">About DirectRent UK</h1>
      <div className="prose lg:prose-lg mx-auto">
        <p className="mb-6">
          DirectRent UK is revolutionizing the way people rent properties in the United Kingdom. 
          Founded with a vision to make property renting simple, transparent, and efficient, 
          we're committed to creating meaningful connections between landlords and tenants.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p className="mb-6">
          To provide an innovative platform that simplifies the rental process while ensuring 
          security, transparency, and satisfaction for both landlords and tenants.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
        <ul className="list-disc pl-6 mb-6">
          <li className="mb-2">Transparency in all our operations</li>
          <li className="mb-2">Innovation in property technology</li>
          <li className="mb-2">Excellence in customer service</li>
          <li className="mb-2">Trust and reliability</li>
        </ul>
      </div>
    </div>
  );
}
