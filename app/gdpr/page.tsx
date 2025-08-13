import React from 'react';

export default function GDPRPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">GDPR Compliance</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">Last updated: July 15, 2025</p>
          
          <p className="mb-4">
            At DirectRent UK, we are committed to protecting and respecting your privacy in 
            accordance with the General Data Protection Regulation (GDPR). This policy explains 
            how we comply with GDPR requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights Under GDPR</h2>
          <p className="mb-4">Under GDPR, you have the following rights:</p>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Access</h3>
              <p>You can request a copy of your personal data and information about how we process it.</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Rectification</h3>
              <p>You can request corrections to your personal data if it is inaccurate or incomplete.</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Erasure</h3>
              <p>You can request deletion of your personal data in certain circumstances.</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Restrict Processing</h3>
              <p>You can request limits on how we use your personal data.</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Data Portability</h3>
              <p>You can request your data in a structured, commonly used format.</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Right to Object</h3>
              <p>You can object to processing of your personal data.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Process Your Data</h2>
          
          <h3 className="text-xl font-semibold mb-3">Legal Bases for Processing</h3>
          <ul className="list-disc pl-6 mb-6">
            <li>Contract fulfillment</li>
            <li>Legal obligations</li>
            <li>Legitimate interests</li>
            <li>Consent</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Data Protection Measures</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Encryption of personal data</li>
            <li>Regular security assessments</li>
            <li>Staff training on data protection</li>
            <li>Access controls and authentication</li>
            <li>Regular backup procedures</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
          <p className="mb-4">
            When we transfer personal data outside the UK/EEA, we ensure appropriate 
            safeguards are in place through:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Standard contractual clauses</li>
            <li>Adequacy decisions</li>
            <li>Data processing agreements</li>
            <li>Privacy Shield certification (where applicable)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Breach Procedures</h2>
          <p className="mb-4">
            In the event of a data breach that risks your rights and freedoms, we will:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Notify supervisory authorities within 72 hours</li>
            <li>Inform affected individuals without undue delay</li>
            <li>Document all breaches and remedial actions</li>
            <li>Review and update security measures</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Protection Officer</h2>
          <p className="mb-4">
            Our Data Protection Officer (DPO) oversees our data protection strategy and 
            implementation to ensure compliance with GDPR requirements.
          </p>
          <div className="p-4 border rounded-lg">
            <p className="mb-2"><strong>Contact our DPO:</strong></p>
            <p>Email: dpo@directrent.uk</p>
            <p>Phone: +44 (0)20 1234 5679</p>
            <p>Address: 123 Business Street, London, UK</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Exercising Your Rights</h2>
          <p className="mb-4">
            To exercise any of your rights under GDPR, please contact our DPO using the 
            details above. We will respond to your request within one month.
          </p>
        </section>
      </div>
    </div>
  );
}
