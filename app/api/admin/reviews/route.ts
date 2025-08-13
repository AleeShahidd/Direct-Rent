import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Review, PaginatedResponse, ApiResponse } from '@/types/enhanced';

// GET /api/admin/reviews - Get all reviews with admin capabilities
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
    const rating = searchParams.get('rating');
    const flagged = searchParams.get('flagged');
    const propertyId = searchParams.get('property_id');
    const reviewerId = searchParams.get('reviewer_id');
    const landlordId = searchParams.get('landlord_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort_by') || 'newest';

    // Build query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        property:properties(
          id, title, location_city, price,
          landlord:users(id, full_name, email)
        ),
        reviewer:users!reviewer_id(id, full_name, email),
        landlord:users!landlord_id(id, full_name, email)
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (rating) {
      query = query.eq('overall_rating', parseInt(rating));
    }

    if (flagged === 'true') {
      query = query.eq('is_flagged', true);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId);
    }

    if (landlordId) {
      query = query.eq('landlord_id', landlordId);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'rating_high':
        query = query.order('overall_rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('overall_rating', { ascending: true });
        break;
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'flagged':
        query = query.order('is_flagged', { ascending: false });
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

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Admin reviews query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch reviews',
        message: error.message
      }, { status: 500 });
    }

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: PaginatedResponse<Review> = {
      data: reviews || [],
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
    console.error('Admin reviews API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/admin/reviews - Bulk actions on reviews
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
    const { action, review_ids, data } = body;

    if (!action || !review_ids || !Array.isArray(review_ids)) {
      return NextResponse.json({
        success: false,
        error: 'Action and review_ids array are required'
      }, { status: 400 });
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'approve':
        updateData = { 
          status: 'approved',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews approved successfully';
        break;

      case 'reject':
        updateData = { 
          status: 'rejected',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews rejected successfully';
        break;

      case 'flag':
        updateData = { 
          is_flagged: true,
          flagged_reason: data?.reason || 'Flagged by admin',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews flagged successfully';
        break;

      case 'unflag':
        updateData = { 
          is_flagged: false,
          flagged_reason: null,
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews unflagged successfully';
        break;

      case 'hide':
        updateData = { 
          status: 'hidden',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews hidden successfully';
        break;

      case 'show':
        updateData = { 
          status: 'approved',
          moderated_by: user.id,
          moderated_at: new Date().toISOString()
        };
        successMessage = 'Reviews made visible successfully';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Update reviews
    const { data: updatedReviews, error } = await supabase
      .from('reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .in('id', review_ids)
      .select();

    if (error) {
      console.error('Bulk reviews update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update reviews',
        message: error.message
      }, { status: 500 });
    }

    const response: ApiResponse<Review[]> = {
      success: true,
      data: updatedReviews as Review[],
      message: successMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin reviews bulk action API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
