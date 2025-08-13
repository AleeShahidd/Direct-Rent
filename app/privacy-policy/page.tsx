import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">Last updated: July 15, 2025</p>
          
          <p className="mb-4">
            DirectRent UK ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you visit our website and use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and contact information</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Address and location data</li>
            <li>Payment information</li>
            <li>Property preferences and search history</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Usage Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Pages visited and time spent</li>
            <li>Referral sources</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>To provide and maintain our services</li>
            <li>To process your transactions</li>
            <li>To send you marketing communications (with your consent)</li>
            <li>To improve our website and services</li>
            <li>To comply with legal obligations</li>
            <li>To protect against fraud and unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
          <p className="mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Service providers and business partners</li>
            <li>Law enforcement when required by law</li>
            <li>Other users when you explicitly consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your 
            personal information. However, no method of transmission over the internet is 
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-none pl-6 mb-4">
            <li>Email: privacy@directrent.uk</li>
            <li>Phone: +44 (0)20 1234 5678</li>
            <li>Address: 123 Business Street, London, UK</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
