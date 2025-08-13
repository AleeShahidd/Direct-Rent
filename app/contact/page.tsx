import React from 'react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
      
      <div className="max-w-3xl mx-auto">
        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 border rounded-lg text-center">
            <svg className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <p className="text-gray-600">support@directrent.uk</p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <svg className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Phone</h2>
            <p className="text-gray-600">+44 (0)20 1234 5678</p>
          </div>
          <div className="p-6 border rounded-lg text-center">
            <svg className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Office</h2>
            <p className="text-gray-600">123 Business Street<br/>London, UK</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full p-3 border rounded-lg"
                placeholder="Message subject"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full p-3 border rounded-lg"
                placeholder="Your message"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">What are your business hours?</h3>
              <p className="text-gray-600">We're available Monday to Friday, 9am to 6pm GMT.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">What's your typical response time?</h3>
              <p className="text-gray-600">We aim to respond to all inquiries within 24 hours during business days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
