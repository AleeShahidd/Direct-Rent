import React from 'react';

export default function CareersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Careers at DirectRent UK</h1>
      
      <div className="prose lg:prose-lg mx-auto">
        <p className="mb-6">
          Join our dynamic team and help shape the future of property renting in the UK. 
          We're always looking for talented individuals who share our passion for innovation 
          and excellence in the property technology sector.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Current Openings</h2>
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Senior Software Engineer</h3>
            <p className="text-gray-600 mb-4">
              Help build and scale our property management platform using cutting-edge technologies.
            </p>
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
              Apply Now
            </button>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Property Account Manager</h3>
            <p className="text-gray-600 mb-4">
              Work with landlords to help them maximize their property potential.
            </p>
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
              Apply Now
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Benefits</h2>
        <ul className="list-disc pl-6 mb-6">
          <li>Competitive salary and equity packages</li>
          <li>Flexible working arrangements</li>
          <li>Health and wellness benefits</li>
          <li>Professional development opportunities</li>
          <li>Regular team events and activities</li>
        </ul>
      </div>
    </div>
  );
}
