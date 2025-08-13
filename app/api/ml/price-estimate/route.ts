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

    // Call ML API
    const mlResponse = await fetch(`${ML_API_BASE_URL}/price-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML API responded with status: ${mlResponse.status}`);
    }

    const priceData: PriceEstimateResponse = await mlResponse.json();

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
