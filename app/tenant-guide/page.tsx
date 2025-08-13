import React from 'react';

export default function TenantGuidePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Tenant Guide</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Finding Your Perfect Home</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Search Tips</h3>
              <ul className="list-disc pl-6">
                <li>Define your must-haves and nice-to-haves</li>
                <li>Set a realistic budget including bills</li>
                <li>Research the local area thoroughly</li>
                <li>Use our advanced search filters</li>
                <li>Save your favorite properties</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Viewing Properties</h2>
          <div className="space-y-6">
            <p>
              Make the most of your property viewings with our comprehensive checklist:
            </p>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Viewing Checklist</h3>
              <ul className="list-disc pl-6">
                <li>Check the condition of walls, floors, and ceilings</li>
                <li>Test all appliances and fixtures</li>
                <li>Check mobile signal and internet connectivity</li>
                <li>Assess natural light and ventilation</li>
                <li>Investigate storage space</li>
                <li>Ask about utility costs</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Application Process</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Required Documents</h3>
              <ul className="list-disc pl-6">
                <li>Proof of ID</li>
                <li>Proof of address</li>
                <li>Employment references</li>
                <li>Bank statements</li>
                <li>Previous landlord references</li>
              </ul>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
              <ol className="list-decimal pl-6">
                <li>Submit application</li>
                <li>Pay holding deposit</li>
                <li>Complete referencing</li>
                <li>Sign tenancy agreement</li>
                <li>Pay first month's rent and deposit</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your Rights as a Tenant</h2>
          <div className="p-6 border rounded-lg">
            <ul className="space-y-4">
              <li>Right to live in a property that's safe and in a good state of repair</li>
              <li>Protection from unfair eviction and unfair rent</li>
              <li>Right to have your deposit protected</li>
              <li>Right to challenge excessively high charges</li>
              <li>Right to know who your landlord is</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
