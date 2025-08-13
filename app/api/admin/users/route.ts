import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AdminUser, PaginatedResponse, ApiResponse } from '@/types/enhanced';

// GET /api/admin/users - Get all users with admin details
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
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const verification = searchParams.get('verification');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort_by') || 'newest';

    // Build query
    let query = supabase
      .from('users')
      .select(`
        *,
        properties:properties(count),
        bookings_as_tenant:bookings!tenant_id(count),
        bookings_as_landlord:bookings!landlord_id(count),
        reviews:reviews!reviewer_id(count, overall_rating)
      `);

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('account_status', status);
    }

    if (verification) {
      query = query.eq('verification_status', verification);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name':
        query = query.order('full_name', { ascending: true });
        break;
      case 'email':
        query = query.order('email', { ascending: true });
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

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Admin users query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        message: error.message
      }, { status: 500 });
    }

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = users?.map(user => ({
      ...user,
      total_properties: user.properties?.[0]?.count || 0,
      total_bookings: (user.bookings_as_tenant?.[0]?.count || 0) + (user.bookings_as_landlord?.[0]?.count || 0),
      total_reviews: user.reviews?.[0]?.count || 0,
      average_rating: user.reviews?.length > 0 ? 
        user.reviews.reduce((sum: number, r: any) => sum + r.overall_rating, 0) / user.reviews.length : 0
    })) || [];

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: PaginatedResponse<AdminUser> = {
      data: adminUsers,
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
    console.error('Admin users API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new user (admin only)
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
    const {
      email,
      full_name,
      role,
      phone,
      verification_status,
      account_status
    } = body;

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json({
        success: false,
        error: 'Email, full name, and role are required'
      }, { status: 400 });
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name,
        role,
        phone,
        verification_status: verification_status || 'pending',
        account_status: account_status || 'active',
        email_verified: false,
        phone_verified: false
      })
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user',
        message: createError.message
      }, { status: 500 });
    }

    const response: ApiResponse<AdminUser> = {
      success: true,
      data: newUser as AdminUser,
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Admin user creation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
