/**
 * DirectRent UK - Fraud Detection API
 * Analyzes property listings for potential fraud indicators
 * TypeScript version
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { FraudDetectionModel } from '@/ml/utils/fraudDetectionModel';
import { UKHousingDataProcessor } from '@/ml/utils/dataProcessor';

export async function POST(req: Request) {
  try {
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['property_data', 'landlord_id'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    const { property_data, landlord_id } = data;
    
    // Initialize fraud detection model
    const fraudModel = new FraudDetectionModel();
    const modelLoaded = fraudModel.loadModel();
    
    // Initialize data processor for market statistics
    const dataProcessor = new UKHousingDataProcessor();
    await dataProcessor.processFullDataset();
    
    // Get market statistics for price analysis
    const city = property_data.city || '';
    const propertyType = property_data.property_type || '';
    property_data.market_average = dataProcessor.getMarketStatistics(city, propertyType).average_price;
    
    // Get landlord listing count
    let landlordListingCount = 0;
    
    try {
      // Create Supabase client
      const supabase = createClient();
      
      // Count properties by this landlord
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', landlord_id);
      
      if (!error) {
        landlordListingCount = count || 0;
      }
    } catch (dbError) {
      console.warn('Error getting landlord listing count:', dbError);
    }
    
    property_data.landlord_listing_count = landlordListingCount;
    
    // Detect fraud
    const fraudDetection = fraudModel.detectFraud(property_data);
    
    // Store result in database if it's suspicious
    if (fraudDetection.fraud_score > 0.3) {
      try {
        const supabase = createClient();
        
        await supabase.from('fraud_reports').insert({
          property_id: property_data.id,
          landlord_id: landlord_id,
          fraud_score: fraudDetection.fraud_score,
          is_fraudulent: fraudDetection.is_fraudulent,
          reasons: fraudDetection.reasons,
          risk_factors: fraudDetection.risk_factors,
          report_type: 'ml_detection'
        });
      } catch (dbError) {
        console.log('Error storing fraud detection result:', dbError);
      }
    }
    
    // Return fraud detection result
    return NextResponse.json(fraudDetection);
    
  } catch (error) {
    console.log('Error in fraud detection API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze property for fraud', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET method for testing model health
export async function GET() {
  try {
    // Check if model file exists
    const fraudModel = new FraudDetectionModel();
    const modelExists = fraudModel.loadModel();
    
    return NextResponse.json({
      status: modelExists ? 'active' : 'not_found',
      model: 'fraud_detection',
      suspicious_keywords_count: fraudModel.suspiciousKeywords.length
    });
    
  } catch (error) {
    console.log('Error checking fraud model:', error);
    return NextResponse.json(
      { error: 'Failed to check fraud model status', details: (error as Error).message },
      { status: 500 }
    );
  }
}