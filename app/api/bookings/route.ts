import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Booking, BookingFormData, PaginatedResponse, ApiResponse } from '@/types/enhanced';

// GET /api/bookings - Get bookings with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Extract filter parameters
    const status = searchParams.get('status');
    const propertyId = searchParams.get('property_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort_by') || 'newest';

    // Build query based on user role
    let query = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(
          id,
          title,
          rent_amount,
          address_line_1,
          city,
          postcode,
          property_images(url, is_primary)
        ),
        tenant:users!tenant_id(
          id,
          full_name,
          email,
          avatar_url,
          phone
        ),
        landlord:users!landlord_id(
          id,
          full_name,
          email,
          avatar_url,
          phone
        )
      `);

    // Apply role-based filtering
    if (userData?.role === 'admin') {
      // Admins can see all bookings
    } else if (userData?.role === 'landlord') {
      query = query.eq('landlord_id', user.id);
    } else {
      // Tenants can only see their own bookings
      query = query.eq('tenant_id', user.id);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'status':
        query = query.order('status').order('created_at', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Bookings query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch bookings',
        message: error.message
      }, { status: 500 });
    }

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: PaginatedResponse<Booking> = {
      data: bookings || [],
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking inquiry
export async function POST(request: NextRequest) {
  try {
    // Get authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Check if user is a tenant
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'tenant') {
      return NextResponse.json({
        success: false,
        error: 'Only tenants can create booking inquiries'
      }, { status: 403 });
    }

    const body: BookingFormData = await request.json();
    const {
      property_id,
      message,
      preferred_move_date,
      viewing_date_requests,
      contact_phone,
      additional_occupants,
      employment_status,
      annual_income
    } = body;

    // Validate required fields
    if (!property_id || !message) {
      return NextResponse.json({
        success: false,
        error: 'Property ID and message are required'
      }, { status: 400 });
    }

    // Check if property exists and is available
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, landlord_id, status, title')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    if (property.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Property is not available for booking'
      }, { status: 400 });
    }

    // Check if user has already made an active booking for this property
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('property_id', property_id)
      .eq('tenant_id', user.id)
      .in('status', ['pending', 'accepted', 'viewing_scheduled'])
      .single();

    if (existingBooking) {
      return NextResponse.json({
        success: false,
        error: 'You already have an active booking inquiry for this property'
      }, { status: 400 });
    }

    // Create booking inquiry
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        property_id,
        tenant_id: user.id,
        landlord_id: property.landlord_id,
        message,
        preferred_move_date,
        contact_phone,
        additional_occupants: additional_occupants || 0,
        employment_status,
        annual_income,
        status: 'pending',
        source: 'web',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .select(`
        *,
        property:properties(id, title, rent_amount, address_line_1, city),
        tenant:users!tenant_id(id, full_name, email),
        landlord:users!landlord_id(id, full_name, email)
      `)
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create booking inquiry',
        message: bookingError.message
      }, { status: 500 });
    }

    // Create viewing requests if provided
    if (viewing_date_requests && viewing_date_requests.length > 0) {
      const viewingRecords = viewing_date_requests.map(request => ({
        booking_id: booking.id,
        requested_date: request.date,
        requested_time: request.time,
        notes: request.notes
      }));

      await supabase
        .from('viewing_requests')
        .insert(viewingRecords);
    }

    // TODO: Send notification to landlord
    // TODO: Send confirmation email to tenant

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
      message: 'Booking inquiry created successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Booking creation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
