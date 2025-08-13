import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">Last updated: July 15, 2025</p>
          
          <p className="mb-4">
            Please read these Terms of Service ("Terms") carefully before using the DirectRent UK 
            website and services. These Terms constitute a legally binding agreement between you 
            and DirectRent UK ("we," "our," or "us").
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using our services, you agree to be bound by these Terms. If you do not 
            agree to these Terms, please do not use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p className="mb-4">
            DirectRent UK provides an online platform connecting landlords and tenants for 
            residential property rentals. Our services include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Property listings and searches</li>
            <li>Booking viewings</li>
            <li>Tenant screening</li>
            <li>Rental payments</li>
            <li>Property management tools</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="mb-4">You must:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide accurate information</li>
            <li>Maintain account security</li>
            <li>Not share account credentials</li>
            <li>Notify us of unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-3">Landlords must:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate property information</li>
              <li>Comply with housing laws and regulations</li>
              <li>Maintain properties in habitable condition</li>
              <li>Respond to inquiries promptly</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Tenants must:</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate personal information</li>
              <li>Pay rent and deposits on time</li>
              <li>Comply with tenancy agreements</li>
              <li>Respect property and neighbors</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Fees and Payments</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>All fees are clearly displayed before processing</li>
            <li>Payments are processed securely</li>
            <li>Refunds are subject to our refund policy</li>
            <li>Currency conversions may apply</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
          <p className="mb-4">Users must not:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide false information</li>
            <li>Violate laws or regulations</li>
            <li>Harass or discriminate</li>
            <li>Interfere with platform operation</li>
            <li>Scrape or copy content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Liability Limitations</h2>
          <p className="mb-4">
            We provide our services "as is" and make no warranties, express or implied. 
            We are not liable for:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>User-provided content accuracy</li>
            <li>Property condition or availability</li>
            <li>Third-party services</li>
            <li>Consequential damages</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
          <p className="mb-4">
            We reserve the right to terminate or suspend accounts that violate these Terms 
            or for any other reason at our discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
          <p className="mb-4">
            We may modify these Terms at any time. Continued use of our services constitutes 
            acceptance of modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p className="mb-4">
            For questions about these Terms, please contact us at:
          </p>
          <ul className="list-none pl-6 mb-4">
            <li>Email: legal@directrent.uk</li>
            <li>Phone: +44 (0)20 1234 5678</li>
            <li>Address: 123 Business Street, London, UK</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
