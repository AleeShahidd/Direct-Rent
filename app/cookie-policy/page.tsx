import React from 'react';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Cookie Policy</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">Last updated: July 15, 2025</p>
          
          <p className="mb-4">
            This Cookie Policy explains how DirectRent UK ("we," "our," or "us") uses cookies 
            and similar technologies to recognize you when you visit our website. It explains 
            what these technologies are and why we use them, as well as your rights to control 
            our use of them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are cookies?</h2>
          <p className="mb-4">
            Cookies are small data files that are placed on your computer or mobile device when 
            you visit a website. Cookies are widely used by website owners to make their 
            websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
            <p className="mb-4">
              These cookies are necessary for the website to function and cannot be switched off. 
              They are usually only set in response to actions made by you which amount to a request 
              for services, such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Logging in</li>
              <li>Setting your privacy preferences</li>
              <li>Filling in forms</li>
              <li>Processing payments</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Performance Cookies</h3>
            <p className="mb-4">
              These cookies allow us to count visits and traffic sources so we can measure and 
              improve the performance of our site. They help us to know:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Which pages are the most and least popular</li>
              <li>How visitors move around the site</li>
              <li>If visitors encounter any errors</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Functionality Cookies</h3>
            <p className="mb-4">
              These cookies enable personalized features such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Remembering your preferences</li>
              <li>Saving your favorite properties</li>
              <li>Customizing your view of the website</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Marketing Cookies</h3>
            <p className="mb-4">
              These cookies may be set through our site by our advertising partners to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Build a profile of your interests</li>
              <li>Show you relevant adverts on other sites</li>
              <li>Track the effectiveness of marketing campaigns</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
          <p className="mb-4">
            Most web browsers allow you to control cookies through their settings preferences. 
            However, if you limit the ability of websites to set cookies, you may worsen your 
            overall user experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookie Consent</h2>
          <p className="mb-4">
            When you first visit our website, we will ask for your consent to set cookies on 
            your device. You can change your cookie preferences at any time by clicking the 
            "Cookie Settings" link in the footer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time. We encourage you to periodically 
            review this page for the latest information about our cookie practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about our use of cookies, please contact us at:
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
