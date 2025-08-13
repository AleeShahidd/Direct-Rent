import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Review, ApiResponse } from '@/types/enhanced';

// GET /api/admin/reviews/[id] - Get specific review details
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

    const reviewId = id;

    // Get review with detailed information
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        property:properties(
          id, title, description, price, location_address,
          landlord:users(id, full_name, email, phone)
        ),
        reviewer:users!reviewer_id(
          id, full_name, email, phone, account_status
        ),
        landlord:users!landlord_id(
          id, full_name, email, phone, account_status
        ),
        moderated_by_user:users!moderated_by(
          id, full_name, email
        )
      `)
      .eq('id', reviewId)
      .single();

    if (error || !review) {
      return NextResponse.json({
        success: false,
        error: 'Review not found'
      }, { status: 404 });
    }

    const response: ApiResponse<Review> = {
      success: true,
      data: review as Review,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin review details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/admin/reviews/[id] - Update review
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

    const reviewId = id;
    const body = await request.json();

    // Extract updatable fields
    const updateData: any = {};
    const allowedFields = [
      'status', 'is_flagged', 'flagged_reason', 'admin_notes'
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

    // Add moderation details
    updateData.moderated_by = user.id;
    updateData.moderated_at = new Date().toISOString();

    // Update review
    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        property:properties(id, title),
        reviewer:users!reviewer_id(id, full_name, email),
        landlord:users!landlord_id(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Review update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update review',
        message: error.message
      }, { status: 500 });
    }

    const response: ApiResponse<Review> = {
      success: true,
      data: updatedReview as Review,
      message: 'Review updated successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin review update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id] - Delete review
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

    const reviewId = id;

    // Check if review exists and get details
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, overall_rating, comment, status')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json({
        success: false,
        error: 'Review not found'
      }, { status: 404 });
    }

    // Use soft delete by updating status instead of hard delete
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        status: 'deleted',
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Review deletion error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete review',
        message: updateError.message
      }, { status: 500 });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: reviewId },
      message: 'Review deleted successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin review deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
