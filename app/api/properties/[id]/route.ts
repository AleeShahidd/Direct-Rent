import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Property, ApiResponse } from '@/types/enhanced';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/properties/[id] - Get a single property with full details
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Property ID is required'
      }, { status: 400 });
    }

    // Fetch property with all related data
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Property fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Record property view (async, don't wait)
    recordPropertyView(id, request);

    const response: ApiResponse<Property> = {
      success: true,
      data: property,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Property details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if property exists and user owns it
    const { data: existingProperty, error: propertyError } = await supabase
      .from('properties')
      .select('id, landlord_id')
      .eq('id', id)
      .single();

    if (propertyError || !existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Check ownership or admin privileges
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (existingProperty.landlord_id !== user.id && userData?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to update this property'
      }, { status: 403 });
    }

    const updateData = await request.json();

    // Remove fields that shouldn't be updated directly
    const {
      id: _id,
      landlord_id: _landlordId,
      created_at: _createdAt,
      view_count: _viewCount,
      inquiry_count: _inquiryCount,
      save_count: _saveCount,
      fraud_score: _fraudScore,
      images,
      ...allowedUpdates
    } = updateData;

    // Update property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Property update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update property',
        message: updateError.message
      }, { status: 500 });
    }

    const response: ApiResponse<Property> = {
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Property update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if property exists and user owns it
    const { data: existingProperty, error: propertyError } = await supabase
      .from('properties')
      .select('id, landlord_id, title')
      .eq('id', id)
      .single();

    if (propertyError || !existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Check ownership or admin privileges
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (existingProperty.landlord_id !== user.id && userData?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to delete this property'
      }, { status: 403 });
    }

    // Delete property (cascading will handle related records)
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Property deletion error:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete property',
        message: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Property deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function to record property view
async function recordPropertyView(propertyId: string, request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const sessionId = request.headers.get('x-session-id') || generateSessionId();
    
    // Get user if authenticated
    let viewerId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      viewerId = user?.id || null;
    } catch {
      // Anonymous view
    }

    // Record the view
    await supabase
      .from('property_views')
      .insert({
        property_id: propertyId,
        viewer_id: viewerId,
        session_id: sessionId,
        user_agent: userAgent,
        referrer: referrer,
        source: 'web'
      });

  } catch (error) {
    console.error('Failed to record property view:', error);
    // Don't throw error as this is non-critical
  }
}

// Helper function to generate session ID
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
