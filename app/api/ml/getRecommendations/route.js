/**
 * DirectRent UK - Property Recommendations API
 * Provides personalized property recommendations based on user preferences
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Import ML models (dynamically to avoid issues with server components)
let RecommendationEngine;
let UKHousingDataProcessor;

// Dynamic import helper for server-side only code
const importServerOnly = async () => {
  if (typeof window === 'undefined') {
    const { RecommendationEngine: Engine } = await import('@/ml/utils/recommendationEngine');
    const { UKHousingDataProcessor: Processor } = await import('@/ml/utils/dataProcessor');
    RecommendationEngine = Engine;
    UKHousingDataProcessor = Processor;
  }
};

export async function POST(req) {
  try {
    await importServerOnly();
    
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['user_id', 'preferences'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    const { user_id, preferences, limit = 10 } = data;
    
    // Initialize recommendation engine
    const recommendationEngine = new RecommendationEngine();
    const modelsLoaded = recommendationEngine.loadModels();
    
    // Get active properties from database
    let properties = [];
    
    try {
      // Create Supabase client
      const supabase = createClient();
      
      // Get properties
      const { data: dbProperties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .limit(500); // Limit to prevent performance issues
      
      if (error) {
        throw new Error(`Error fetching properties: ${error.message}`);
      }
      
      properties = dbProperties || [];
      
    } catch (dbError) {
      console.error('Error fetching properties from database:', dbError);
      
      // Fall back to dataset properties if database fetch fails
      const dataProcessor = new UKHousingDataProcessor();
      const processedData = await dataProcessor.processFullDataset();
      properties = processedData;
    }
    
    // Apply basic filtering based on preferences
    let filteredProperties = properties;
    
    if (preferences.price_min) {
      filteredProperties = filteredProperties.filter(p => 
        p.price_per_month >= preferences.price_min
      );
    }
    
    if (preferences.price_max) {
      filteredProperties = filteredProperties.filter(p => 
        p.price_per_month <= preferences.price_max
      );
    }
    
    if (preferences.property_type) {
      filteredProperties = filteredProperties.filter(p => 
        p.property_type === preferences.property_type
      );
    }
    
    if (preferences.min_bedrooms) {
      filteredProperties = filteredProperties.filter(p => 
        p.bedrooms >= preferences.min_bedrooms
      );
    }
    
    // Get recommendations
    let recommendations = [];
    
    if (modelsLoaded && filteredProperties.length > 0) {
      // Use hybrid recommendations if models are loaded
      recommendations = recommendationEngine.getHybridRecommendations(
        user_id, 
        preferences, 
        filteredProperties,
        { limit }
      );
    } else {
      // Fallback to simple filtering if models aren't loaded
      recommendations = filteredProperties
        .slice(0, limit)
        .map(property => ({
          property_id: property.id,
          property,
          score: 0.5,
          reason: 'Matches your search criteria'
        }));
    }
    
    // Format response
    const response = {
      properties: recommendations.map(rec => rec.property),
      scores: recommendations.map(rec => rec.score),
      reasoning: recommendations.map(rec => rec.reason)
    };
    
    // Store user preferences for future recommendations
    try {
      const supabase = createClient();
      
      // Upsert user preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
    } catch (dbError) {
      console.warn('Error storing user preferences:', dbError);
    }
    
    // Return recommendations
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}

// GET method for testing model health
export async function GET() {
  try {
    await importServerOnly();
    
    // Check if model files exist
    const recommendationEngine = new RecommendationEngine();
    const modelsLoaded = recommendationEngine.loadModels();
    
    return NextResponse.json({
      status: modelsLoaded ? 'active' : 'not_found',
      model: 'recommendation'
    });
    
  } catch (error) {
    console.error('Error checking recommendation models:', error);
    return NextResponse.json(
      { error: 'Failed to check recommendation model status', details: error.message },
      { status: 500 }
    );
  }
}
