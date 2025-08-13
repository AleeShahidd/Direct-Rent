import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AdminProperty, PaginatedResponse, ApiResponse } from '@/types/enhanced';

// GET /api/admin/properties - Get all properties with admin details
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const verification = searchParams.get('verification');
    const featured = searchParams.get('featured');
    const flagged = searchParams.get('flagged');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort_by') || 'newest';

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        *,
        landlord:users(id, full_name, email, account_status),
        bookings:bookings(count),
        reviews:reviews(count, overall_rating),
        flagged_properties:flagged_properties(
          id, reason, status, created_at,
          reporter:users(full_name)
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (verification) {
      query = query.eq('verification_status', verification);
    }

    if (featured !== null) {
      query = query.eq('is_featured', featured === 'true');
    }

    if (flagged === 'true') {
      query = query.not('flagged_properties', 'is', null);
    }

    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    if (city) {
      query = query.ilike('location_city', `%${city}%`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location_address.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'updated':
        query = query.order('updated_at', { ascending: false });
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

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Admin properties query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch properties',
        message: error.message
      }, { status: 500 });
    }

    // Transform properties to AdminProperty format
    const adminProperties: AdminProperty[] = properties?.map(property => ({
      ...property,
      total_bookings: property.bookings?.[0]?.count || 0,
      total_reviews: property.reviews?.[0]?.count || 0,
      average_rating: property.reviews?.length > 0 ? 
        property.reviews.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / property.reviews.length : 0,
      is_flagged: (property.flagged_properties?.length || 0) > 0,
      flags_count: property.flagged_properties?.length || 0
    })) || [];

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: PaginatedResponse<AdminProperty> = {
      data: adminProperties,
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
    console.error('Admin properties API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/admin/properties - Bulk actions on properties
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

    const body = await request.json();
    const { action, property_ids, data } = body;

    if (!action || !property_ids || !Array.isArray(property_ids)) {
      return NextResponse.json({
        success: false,
        error: 'Action and property_ids array are required'
      }, { status: 400 });
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'approve':
        updateData = { 
          verification_status: 'verified',
          status: 'active'
        };
        successMessage = 'Properties approved successfully';
        break;

      case 'reject':
        updateData = { 
          verification_status: 'rejected',
          status: 'inactive'
        };
        successMessage = 'Properties rejected successfully';
        break;

      case 'feature':
        updateData = { is_featured: true };
        successMessage = 'Properties featured successfully';
        break;

      case 'unfeature':
        updateData = { is_featured: false };
        successMessage = 'Properties unfeatured successfully';
        break;

      case 'deactivate':
        updateData = { status: 'inactive' };
        successMessage = 'Properties deactivated successfully';
        break;

      case 'activate':
        updateData = { status: 'active' };
        successMessage = 'Properties activated successfully';
        break;

      case 'update':
        if (!data || typeof data !== 'object') {
          return NextResponse.json({
            success: false,
            error: 'Update data is required for update action'
          }, { status: 400 });
        }
        updateData = data;
        successMessage = 'Properties updated successfully';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Update properties
    const { data: updatedProperties, error } = await supabase
      .from('properties')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .in('id', property_ids)
      .select();

    if (error) {
      console.error('Bulk properties update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update properties',
        message: error.message
      }, { status: 500 });
    }

    const response: ApiResponse<AdminProperty[]> = {
      success: true,
      data: updatedProperties as AdminProperty[],
      message: successMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin properties bulk action API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
