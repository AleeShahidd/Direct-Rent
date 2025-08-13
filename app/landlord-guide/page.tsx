import React from 'react';

export default function LandlordGuidePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Landlord Guide</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-6">
            Whether you're new to being a landlord or have years of experience, our comprehensive
            guide will help you navigate the rental market effectively.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Essential Checklist</h3>
            <ul className="list-disc pl-6">
              <li>Ensure your property meets safety standards</li>
              <li>Obtain necessary certificates and licenses</li>
              <li>Set up landlord insurance</li>
              <li>Prepare your property for viewings</li>
              <li>Understand your legal obligations</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Legal Requirements</h2>
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Safety Regulations</h3>
              <p>Learn about gas safety certificates, electrical safety checks, and more.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Tenant Rights</h3>
              <p>Understanding your responsibilities and tenant rights.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Property Standards</h3>
              <p>Ensuring your property meets minimum standards and regulations.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <ul className="space-y-4">
            <li>Regular property maintenance and inspections</li>
            <li>Effective communication with tenants</li>
            <li>Proper documentation and record-keeping</li>
            <li>Fair rent pricing strategies</li>
            <li>Managing tenant transitions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Download Templates</h3>
              <p>Access our library of document templates</p>
            </a>
            <a href="#" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Tax Guidelines</h3>
              <p>Understanding your tax obligations</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
