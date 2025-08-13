/**
 * DirectRent UK - Price Prediction API
 * Provides rental price prediction based on property features
 */

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Import ML models (dynamically to avoid issues with server components)
let PricePredictionModel;

// Dynamic import helper for server-side only code
const importServerOnly = async () => {
  if (typeof window === 'undefined') {
    const { PricePredictionModel: Model } = await import('@/ml/utils/pricePredictionModel');
    PricePredictionModel = Model;
  }
};

export async function POST(req) {
  try {
    await importServerOnly();
    
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['postcode', 'property_type', 'bedrooms', 'bathrooms', 'furnishing_status'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Instantiate model
    const model = new PricePredictionModel();
    
    // Get price prediction
    const prediction = await model.predictPrice(data);
    
    // Add market insights (this would come from real data in production)
    const marketInsights = {
      average_price: Math.round(prediction.estimated_price * 0.95),
      median_price: Math.round(prediction.estimated_price * 0.98),
      comparable_properties: Math.floor(Math.random() * 30) + 10
    };
    
    // Return prediction
    return NextResponse.json({
      estimated_price: prediction.estimated_price,
      confidence: prediction.confidence,
      price_range: prediction.price_range,
      market_insights: marketInsights
    });
    
  } catch (error) {
    console.error('Error in price prediction API:', error);
    return NextResponse.json(
      { error: 'Failed to generate price prediction', details: error.message },
      { status: 500 }
    );
  }
}

// GET method for testing model health
export async function GET() {
  try {
    // Check if model file exists
    const modelPath = path.join(process.cwd(), 'ml', 'models', 'price_model', 'model.json');
    const modelExists = fs.existsSync(modelPath);
    
    // Get model stats if it exists
    let modelStats = null;
    if (modelExists) {
      const metadataPath = path.join(process.cwd(), 'ml', 'models', 'price_model', 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        modelStats = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }
      
      const evaluationPath = path.join(process.cwd(), 'ml', 'models', 'price_model', 'evaluation.json');
      if (fs.existsSync(evaluationPath)) {
        const evaluation = JSON.parse(fs.readFileSync(evaluationPath, 'utf8'));
        modelStats = { ...modelStats, evaluation };
      }
    }
    
    return NextResponse.json({
      status: modelExists ? 'active' : 'not_found',
      model: 'price_prediction',
      stats: modelStats
    });
    
  } catch (error) {
    console.error('Error checking price model:', error);
    return NextResponse.json(
      { error: 'Failed to check price model status', details: error.message },
      { status: 500 }
    );
  }
}
