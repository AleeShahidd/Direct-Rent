import React from 'react';

export default function RentingTipsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Renting Tips</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Before You Start</h2>
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Budget Planning</h3>
              <ul className="list-disc pl-6">
                <li>Calculate your maximum affordable rent</li>
                <li>Account for utility bills and council tax</li>
                <li>Consider additional costs like internet and TV license</li>
                <li>Plan for the security deposit</li>
                <li>Budget for moving costs</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Smart Renting Tips</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Location Research</h3>
              <ul className="list-disc pl-6">
                <li>Check local transport links</li>
                <li>Research local amenities</li>
                <li>Visit the area at different times</li>
                <li>Look up crime statistics</li>
                <li>Consider commute times</li>
              </ul>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Property Inspection</h3>
              <ul className="list-disc pl-6">
                <li>Check for damp and mold</li>
                <li>Test all appliances</li>
                <li>Check window and door security</li>
                <li>Assess storage space</li>
                <li>Review energy performance</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Moving In Checklist</h2>
          <div className="p-6 border rounded-lg">
            <ol className="list-decimal pl-6 space-y-4">
              <li>
                <strong>Document Everything</strong>
                <p>Take photos of the property condition and inventory items</p>
              </li>
              <li>
                <strong>Set Up Utilities</strong>
                <p>Transfer or set up electricity, gas, water, and council tax</p>
              </li>
              <li>
                <strong>Update Your Address</strong>
                <p>Notify relevant parties of your new address</p>
              </li>
              <li>
                <strong>Get Insurance</strong>
                <p>Arrange contents insurance for your belongings</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Being a Good Tenant</h2>
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <ul className="space-y-4">
                <li>Pay rent and bills on time</li>
                <li>Keep the property clean and well-maintained</li>
                <li>Report repairs promptly</li>
                <li>Be considerate of neighbors</li>
                <li>Follow the terms of your tenancy agreement</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Common Mistakes to Avoid</h2>
          <div className="p-6 border rounded-lg">
            <ul className="list-disc pl-6 space-y-4">
              <li>Not reading the tenancy agreement thoroughly</li>
              <li>Forgetting to document property condition at move-in</li>
              <li>Not getting contents insurance</li>
              <li>Ignoring small maintenance issues</li>
              <li>Not keeping copies of important documents</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
