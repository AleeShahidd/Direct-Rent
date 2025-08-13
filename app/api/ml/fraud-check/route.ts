import { NextRequest, NextResponse } from 'next/server';
import { FraudCheckRequest, FraudCheckResponse } from '@/types';

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body: FraudCheckRequest = await request.json();

    // Validate required fields
    if (!body.property || !body.landlord_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields for fraud detection',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Prepare ML API request
    const mlRequest = {
      property_data: {
        title: body.property.title,
        description: body.property.description,
        price_per_month: body.property.price_per_month,
        postcode: body.property.postcode,
        property_type: body.property.property_type,
        bedrooms: body.property.bedrooms,
        bathrooms: body.property.bathrooms,
        images: body.property.images || []
      },
      landlord_id: body.landlord_id
    };

    // Call ML API
    const mlResponse = await fetch(`${ML_API_BASE_URL}/fraud-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mlRequest),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML API responded with status: ${mlResponse.status}`);
    }

    const fraudData: FraudCheckResponse = await mlResponse.json();

    // Log high-risk properties for admin review
    if (fraudData.is_fraudulent) {
      console.warn(`High fraud risk detected for property: ${body.property.title}`, {
        fraud_score: fraudData.fraud_score,
        reasons: fraudData.reasons,
        landlord_id: body.landlord_id
      });

      // TODO: Store in fraud_reports table for admin review
      // await createFraudReport(body.property, fraudData);
    }

    return NextResponse.json({
      success: true,
      data: fraudData,
      message: 'Fraud detection completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fraud detection API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze property for fraud',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
