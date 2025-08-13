import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AdminUser, ApiResponse } from '@/types/enhanced';

// GET /api/admin/users/[id] - Get specific user details
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

    const userId = id;

    // Get user with detailed information
    const { data: userDetails, error } = await supabase
      .from('users')
      .select(`
        *,
        properties:properties(
          id, title, status, type, price, location_city, created_at
        ),
        bookings_as_tenant:bookings!tenant_id(
          id, status, created_at, property:properties(title)
        ),
        bookings_as_landlord:bookings!landlord_id(
          id, status, created_at, property:properties(title)
        ),
        reviews_given:reviews!reviewer_id(
          id, overall_rating, comment, created_at, property:properties(title)
        ),
        reviews_received:reviews!landlord_id(
          id, overall_rating, comment, created_at, reviewer:users(full_name)
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !userDetails) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Calculate statistics
    const adminUser: AdminUser = {
      ...userDetails,
      total_properties: userDetails.properties?.length || 0,
      total_bookings: (userDetails.bookings_as_tenant?.length || 0) + (userDetails.bookings_as_landlord?.length || 0),
      total_reviews: userDetails.reviews_given?.length || 0,
      average_rating: userDetails.reviews_received?.length > 0 ? 
        userDetails.reviews_received.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / userDetails.reviews_received.length : 0
    };

    const response: ApiResponse<AdminUser> = {
      success: true,
      data: adminUser,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin user details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user details
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

    const userId = id;
    const body = await request.json();

    // Extract updatable fields
    const updateData: any = {};
    const allowedFields = [
      'full_name', 'phone', 'bio', 'profile_picture',
      'role', 'verification_status', 'account_status',
      'email_verified', 'phone_verified'
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

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user',
        message: error.message
      }, { status: 500 });
    }

    const response: ApiResponse<AdminUser> = {
      success: true,
      data: updatedUser as AdminUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user account
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

    const userId = id;

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account'
      }, { status: 400 });
    }

    // Check if user exists and get details
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Use soft delete by updating account_status instead of hard delete
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        account_status: 'deleted',
        email: `deleted_${userId}@example.com`, // Prevent email conflicts
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('User deletion error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete user',
        message: updateError.message
      }, { status: 500 });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: userId },
      message: `User ${existingUser.full_name} has been deleted`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin user deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
