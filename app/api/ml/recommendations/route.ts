import { NextRequest, NextResponse } from 'next/server';

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface RecommendationRequest {
  user_id: string;
  preferences: {
    preferred_postcode?: string;
    price_min?: number;
    price_max?: number;
    property_type?: string;
    min_bedrooms?: number;
    max_bedrooms?: number;
    furnishing_status?: string;
    city?: string;
  };
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();

    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required for recommendations',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Call ML API
    const mlResponse = await fetch(`${ML_API_BASE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML API responded with status: ${mlResponse.status}`);
    }

    const recommendationData = await mlResponse.json();

    return NextResponse.json({
      success: true,
      data: recommendationData,
      message: 'Recommendations generated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Default preferences if none provided
    const defaultPreferences = {
      price_min: 500,
      price_max: 5000,
      city: 'London'
    };

    const mlRequest = {
      user_id: userId,
      preferences: defaultPreferences,
      limit
    };

    const mlResponse = await fetch(`${ML_API_BASE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mlRequest),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML API responded with status: ${mlResponse.status}`);
    }

    const recommendationData = await mlResponse.json();

    return NextResponse.json({
      success: true,
      data: recommendationData,
      message: 'Recommendations generated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
