import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Model variables (would normally be in a separate file)
let model = null;
let modelMetadata = null;
let isModelLoading = false;
let lastModelLoadAttempt = 0;

// Get model from storage or load from saved model
async function getModel() {
  const now = Date.now();
  
  // If model is already loaded, return it
  if (model) {
    return { model, metadata: modelMetadata };
  }
  
  // If another request is already loading the model, wait for it
  if (isModelLoading) {
    // Wait up to 10 seconds for the model to load
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (model) {
        return { model, metadata: modelMetadata };
      }
    }
    throw new Error('Timeout waiting for model to load');
  }
  
  // If model was attempted to be loaded in the last 5 minutes and failed, 
  // don't try again to prevent overloading
  if (!model && now - lastModelLoadAttempt < 5 * 60 * 1000 && lastModelLoadAttempt !== 0) {
    throw new Error('Recent model load attempt failed, try again later');
  }
  
  // Load the model
  try {
    isModelLoading = true;
    lastModelLoadAttempt = now;
    
    // Try to load from storage first
    const { data: modelData, error: modelError } = await supabase
      .storage
      .from('ml-models')
      .download('price-prediction/model.json');
      
    if (modelError) {
      console.error('Error downloading model:', modelError);
      throw new Error('Failed to download model');
    }
    
    // Get metadata
    const { data: metadataData, error: metadataError } = await supabase
      .storage
      .from('ml-models')
      .download('price-prediction/metadata.json');
      
    if (metadataError) {
      console.error('Error downloading model metadata:', metadataError);
      throw new Error('Failed to download model metadata');
    }
    
    // Parse metadata
    const metadataText = await metadataData.text();
    modelMetadata = JSON.parse(metadataText);
    
    // Convert the model file to a blob URL
    const modelBlob = new Blob([modelData], { type: 'application/json' });
    const modelUrl = URL.createObjectURL(modelBlob);
    
    // Load the model
    model = await tf.loadLayersModel(modelUrl);
    
    // Clean up the blob URL
    URL.revokeObjectURL(modelUrl);
    
    return { model, metadata: modelMetadata };
  } catch (error) {
    console.error('Error loading model:', error);
    
    // Fallback to a simple linear regression model
    try {
      // Create a simple model for now
      const fallbackModel = tf.sequential();
      fallbackModel.add(tf.layers.dense({ units: 10, inputShape: [8], activation: 'relu' }));
      fallbackModel.add(tf.layers.dense({ units: 1 }));
      
      // Compile the model
      fallbackModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
      
      model = fallbackModel;
      modelMetadata = {
        features: [
          'bedrooms', 'bathrooms', 'property_type_encoded', 'city_encoded',
          'furnishing_status_encoded', 'postcode_first_part_encoded',
          'has_parking', 'has_garden'
        ],
        mean: [2.5, 1.5, 2, 50, 1, 100, 0.5, 0.3],
        std: [1.2, 0.7, 1.5, 30, 0.8, 50, 0.5, 0.5],
        propertyTypes: { 'Flat': 0, 'House': 1, 'Studio': 2, 'Bungalow': 3, 'Maisonette': 4 },
        furnishingStatus: { 'Furnished': 0, 'Unfurnished': 1, 'Part-Furnished': 2 }
      };
      
      return { model, metadata: modelMetadata };
    } catch (fallbackError) {
      console.error('Error creating fallback model:', fallbackError);
      throw new Error('Failed to load or create model');
    }
  } finally {
    isModelLoading = false;
  }
}

// Process the input data
function preprocessInput(data, metadata) {
  // Create a feature array based on metadata.features
  const features = [];
  
  // Helper function to get property type encoding
  const getPropertyTypeEncoding = (propertyType) => {
    return metadata.propertyTypes[propertyType] !== undefined 
      ? metadata.propertyTypes[propertyType] 
      : 0; // Default to Flat if unknown
  };
  
  // Helper function to get furnishing status encoding
  const getFurnishingStatusEncoding = (furnishingStatus) => {
    return metadata.furnishingStatus[furnishingStatus] !== undefined 
      ? metadata.furnishingStatus[furnishingStatus] 
      : 0; // Default to Furnished if unknown
  };
  
  // Helper function to encode the postcode
  const encodePostcode = (postcode) => {
    if (!postcode) return 0;
    const cleanPostcode = postcode.trim().toUpperCase();
    const firstPart = cleanPostcode.split(' ')[0];
    
    // Simple hash function for the postcode first part
    let hash = 0;
    for (let i = 0; i < firstPart.length; i++) {
      hash = ((hash << 5) - hash) + firstPart.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Normalize to a reasonable range (0-200)
    return Math.abs(hash % 200);
  };
  
  // Helper function to encode the city
  const encodeCity = (city) => {
    if (!city) return 0;
    const cleanCity = city.trim().toLowerCase();
    
    // Simple hash function for the city
    let hash = 0;
    for (let i = 0; i < cleanCity.length; i++) {
      hash = ((hash << 5) - hash) + cleanCity.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Normalize to a reasonable range (0-100)
    return Math.abs(hash % 100);
  };
  
  // Map the input data to features
  features[0] = parseFloat(data.bedrooms) || 1; // Default to 1 bedroom
  features[1] = parseFloat(data.bathrooms) || 1; // Default to 1 bathroom
  features[2] = getPropertyTypeEncoding(data.property_type);
  features[3] = encodeCity(data.city);
  features[4] = getFurnishingStatusEncoding(data.furnishing_status);
  features[5] = encodePostcode(data.postcode);
  features[6] = data.parking ? 1 : 0;
  features[7] = data.garden ? 1 : 0;
  
  // Normalize the features
  for (let i = 0; i < features.length; i++) {
    features[i] = (features[i] - metadata.mean[i]) / metadata.std[i];
  }
  
  return features;
}

// Handle the prediction request
export async function POST(request) {
  try {
    // Get the property data
    const propertyData = await request.json();
    
    // Validate required fields
    if (!propertyData.property_type || !propertyData.bedrooms) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['property_type', 'bedrooms'],
          received: Object.keys(propertyData)
        }, 
        { status: 400 }
      );
    }
    
    // Get similar properties for comparison
    const { data: similarProperties, error: similarError } = await supabase
      .from('properties')
      .select('price_per_month, bedrooms, bathrooms, property_type, city, postcode')
      .eq('property_type', propertyData.property_type)
      .eq('bedrooms', propertyData.bedrooms)
      .eq('is_active', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (similarError) {
      console.error('Error fetching similar properties:', similarError);
    }
    
    // Calculate average price from similar properties
    let avgPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;
    
    if (similarProperties && similarProperties.length > 0) {
      const prices = similarProperties.map(p => p.price_per_month);
      avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
    
    // Get the ML model
    try {
      const { model, metadata } = await getModel();
      
      // Preprocess the input data
      const processedInput = preprocessInput(propertyData, metadata);
      
      // Make the prediction
      const inputTensor = tf.tensor2d([processedInput]);
      const prediction = model.predict(inputTensor);
      const predictionData = await prediction.data();
      const predictedPrice = predictionData[0];
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Blend ML prediction with similar properties data
      let finalPrediction = predictedPrice;
      let confidence = 0.7; // Default medium confidence
      
      if (similarProperties && similarProperties.length > 0) {
        // Blend ML prediction with similar properties average
        const blendRatio = 0.6; // 60% ML, 40% similar properties
        finalPrediction = (predictedPrice * blendRatio) + (avgPrice * (1 - blendRatio));
        
        // Adjust confidence based on number of similar properties
        confidence = Math.min(0.9, 0.5 + (similarProperties.length * 0.08));
      }
      
      // Round to nearest 10
      finalPrediction = Math.round(finalPrediction / 10) * 10;
      
      // Calculate price range (wider if less confident)
      const rangeWidth = (1 - confidence) * 0.4 + 0.1; // Between 10% and 50%
      const min = Math.round((finalPrediction * (1 - rangeWidth)) / 10) * 10;
      const max = Math.round((finalPrediction * (1 + rangeWidth)) / 10) * 10;
      
      // Return the prediction
      return NextResponse.json({
        estimated_price: finalPrediction,
        confidence,
        price_range: {
          min,
          max
        },
        comparable_properties: similarProperties || []
      });
    } catch (modelError) {
      console.error('Model prediction error:', modelError);
      
      // Fallback to similar properties only
      if (similarProperties && similarProperties.length > 0) {
        return NextResponse.json({
          estimated_price: Math.round(avgPrice / 10) * 10,
          confidence: 0.5,
          price_range: {
            min: Math.round(minPrice * 0.9 / 10) * 10,
            max: Math.round(maxPrice * 1.1 / 10) * 10
          },
          comparable_properties: similarProperties,
          model_status: 'fallback_to_comparables'
        });
      }
      
      throw modelError;
    }
  } catch (error) {
    console.error('Price prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict price: ' + error.message }, 
      { status: 500 }
    );
  }
}
