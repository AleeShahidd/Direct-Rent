/**
 * ML Integration Page
 * Demonstrates JavaScript ML capabilities
 */

'use client';

import { useState, useEffect } from 'react';
import MLIntegrationDemo from '@/components/ml/MLIntegrationDemo';

export default function MLDemoPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading ML models
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">JavaScript ML Features Demo</h1>
          <p className="text-gray-600">
            Explore the machine learning capabilities implemented in JavaScript
          </p>
        </div>
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 mb-4 rounded-full bg-indigo-200"></div>
              <div className="h-4 w-48 bg-indigo-200 rounded mb-4"></div>
              <div className="h-2 w-64 bg-gray-200 rounded mb-2.5"></div>
              <div className="h-2 w-56 bg-gray-200 rounded"></div>
            </div>
            <p className="text-gray-500 mt-4">Loading ML models...</p>
          </div>
        ) : (
          <MLIntegrationDemo />
        )}
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">About the JavaScript ML Implementation</h2>
          <p className="mb-4">
            This demo showcases the machine learning features implemented in JavaScript using TensorFlow.js and other JS ML libraries. All ML functionality previously implemented in Python has been migrated to JavaScript and runs directly within the Next.js application.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Key Features:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Price Prediction Model:</strong> Predicts rental prices based on property characteristics using TensorFlow.js
            </li>
            <li>
              <strong>Recommendation Engine:</strong> Suggests properties based on user preferences using a hybrid filtering approach
            </li>
            <li>
              <strong>Fraud Detection System:</strong> Identifies potentially fraudulent listings using rule-based and ML-based approaches
            </li>
            <li>
              <strong>Real-time Model Monitoring:</strong> Tracks ML model performance and system health
            </li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Technical Implementation:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>TensorFlow.js:</strong> Powers neural network models for price prediction
            </li>
            <li>
              <strong>ml-random-forest:</strong> Provides decision tree models for fraud detection
            </li>
            <li>
              <strong>matrix-factorization:</strong> Enables collaborative filtering for recommendations
            </li>
            <li>
              <strong>Next.js API Routes:</strong> Serve ML predictions and process requests
            </li>
            <li>
              <strong>React Components:</strong> Display ML insights in the user interface
            </li>
          </ul>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              For detailed documentation, see <code>/docs/ml-javascript-implementation.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
