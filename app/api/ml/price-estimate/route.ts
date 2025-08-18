import { NextRequest, NextResponse } from 'next/server';
import { PriceEstimateRequest, PriceEstimateResponse } from '@/types';

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body: PriceEstimateRequest = await request.json();

    // Validate required fields
    if (!body.postcode || !body.property_type || !body.bedrooms || !body.bathrooms || !body.furnishing_status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields for price estimation',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    let priceData: PriceEstimateResponse;

    // Call ML API
    try {
      console.log(`Calling ML API at ${ML_API_BASE_URL}/price-estimate with data:`, body);
      
      const mlResponse = await fetch(`${ML_API_BASE_URL}/price-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!mlResponse.ok) {
        console.error(`ML API error: ${mlResponse.status} ${mlResponse.statusText}`);
        const errorText = await mlResponse.text().catch(() => 'No error text available');
        throw new Error(`ML API responded with status: ${mlResponse.status}. Error: ${errorText}`);
      }

      priceData = await mlResponse.json();
      
      // Validate the response data
      if (!priceData || typeof priceData.estimated_price !== 'number') {
        throw new Error('Invalid response from ML API: Missing or invalid estimated_price');
      }
      
      console.log('Successfully received price data from ML API:', priceData);
    } catch (mlError) {
      console.error('ML service error:', mlError);
      
      // Fallback logic - provide a basic estimate when the ML service is unavailable
      const { property_type, bedrooms, bathrooms, furnishing_status } = body;
      
      console.log('Using fallback price estimation logic');
      
      // Simple fallback algorithm based on property attributes
      let basePrice = 0;
      switch (property_type) {
        case 'Studio': basePrice = 900; break;
        case 'Flat': basePrice = 1200; break;
        case 'House': basePrice = 1800; break;
        case 'Bungalow': basePrice = 1500; break;
        case 'Maisonette': basePrice = 1300; break;
        default: basePrice = 1200;
      }
      
      // Adjust for bedrooms
      basePrice += (bedrooms - 1) * 300;
      
      // Adjust for bathrooms
      basePrice += (bathrooms - 1) * 150;
      
      // Adjust for furnishing
      if (furnishing_status === 'Furnished') basePrice += 200;
      else if (furnishing_status === 'Part-Furnished') basePrice += 100;
      
      priceData = {
        estimated_price: basePrice,
        confidence: 0.5, // Lower confidence for fallback
        price_range: {
          min: Math.round(basePrice * 0.85),
          max: Math.round(basePrice * 1.15)
        },
        market_insights: {
          average_price: basePrice,
          median_price: basePrice,
          comparable_properties: 0
        }
      };
      
      return NextResponse.json({
        success: true,
        data: priceData,
        message: 'Price estimation completed with fallback algorithm (ML service unavailable)',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: priceData,
      message: 'Price estimation completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Price estimation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to estimate price',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
