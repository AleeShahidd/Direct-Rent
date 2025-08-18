import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AdminProperty, ApiResponse } from '@/types/enhanced';

// GET /api/admin/properties/[id] - Get specific property details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const propertyId = id;

    // Get property with detailed information
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        landlord:users(
          id, full_name, email, phone, account_status, verification_status
        ),
        bookings:bookings(
          id, status, created_at, requested_date, tenant:users(full_name, email)
        ),
        reviews:reviews(
          id, overall_rating, comment, created_at, 
          reviewer:users(full_name), property_rating
        ),
        flagged_properties:flagged_properties(
          id, reason, description, status, created_at,
          reporter:users(full_name, email)
        ),
        property_views:property_views(
          id, viewed_at, source, view_duration,
          viewer:users(full_name)
        )
      `)
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Calculate statistics
    const adminProperty: AdminProperty = {
      ...property,
      total_bookings: property.bookings?.length || 0,
      total_reviews: property.reviews?.length || 0,
      average_rating: property.reviews?.length > 0 ? 
        property.reviews.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / property.reviews.length : 0,
      is_flagged: (property.flagged_properties?.length || 0) > 0,
      flags_count: property.flagged_properties?.length || 0
    };

    const response: ApiResponse<AdminProperty> = {
      success: true,
      data: adminProperty,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.log('Admin property details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/admin/properties/[id] - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const propertyId = id;
    const body = await request.json();

    // Extract updatable fields
    const updateData: any = {};
    const allowedFields = [
      'title', 'description', 'price', 'type', 'status',
      'verification_status', 'is_featured', 'bedrooms', 'bathrooms',
      'size_sqft', 'location_address', 'location_city', 'location_county',
      'location_postcode', 'latitude', 'longitude', 'available_from',
      'energy_rating', 'council_tax_band'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    // Update property
    const { data: updatedProperty, error } = await supabase
      .from('properties')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select(`
        *,
        landlord:users(id, full_name, email)
      `)
      .single();

    if (error) {
      console.log('Property update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update property',
        message: error.message
      }, { status: 500 });
    }

    const response: ApiResponse<AdminProperty> = {
      success: true,
      data: updatedProperty as AdminProperty,
      message: 'Property updated successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.log('Admin property update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const propertyId = id;

    // Check if property exists
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, landlord_id')
      .eq('id', propertyId)
      .single();

    if (fetchError || !existingProperty) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Use soft delete by updating status instead of hard delete
    const { error: updateError } = await supabase
      .from('properties')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (updateError) {
      console.log('Property deletion error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete property',
        message: updateError.message
      }, { status: 500 });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: propertyId },
      message: `Property "${existingProperty.title}" has been deleted`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.log('Admin property deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
