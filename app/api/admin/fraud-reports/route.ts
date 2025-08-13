import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FraudReport, PaginatedResponse, ApiResponse } from '@/types/enhanced';

// GET /api/admin/fraud-reports - Get all fraud reports
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
    const priority = searchParams.get('priority');
    const reportType = searchParams.get('report_type');
    const assignedTo = searchParams.get('assigned_to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort_by') || 'newest';

    // Build query
    let query = supabase
      .from('fraud_reports')
      .select(`
        *,
        reporter:users!reported_by(id, full_name, email),
        property:properties(id, title, location_city),
        reported_user:users!user_id(id, full_name, email),
        assigned_admin:users!assigned_to(id, full_name)
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'priority':
        query = query.order('priority', { ascending: false });
        break;
      case 'status':
        query = query.order('status', { ascending: true });
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

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Fraud reports query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch fraud reports',
        message: error.message
      }, { status: 500 });
    }

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: PaginatedResponse<FraudReport> = {
      data: reports || [],
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
    console.error('Admin fraud reports API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/admin/fraud-reports - Create new fraud report (admin creation)
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
      property_id,
      user_id,
      report_type,
      description,
      evidence_urls,
      priority
    } = body;

    // Validate required fields
    if (!report_type || !description) {
      return NextResponse.json({
        success: false,
        error: 'Report type and description are required'
      }, { status: 400 });
    }

    if (!property_id && !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Either property_id or user_id must be provided'
      }, { status: 400 });
    }

    // Create fraud report
    const { data: newReport, error: createError } = await supabase
      .from('fraud_reports')
      .insert({
        reported_by: user.id, // Admin creating the report
        property_id,
        user_id,
        report_type,
        description,
        evidence_urls: evidence_urls || [],
        status: 'pending',
        priority: priority || 'medium',
        assigned_to: user.id // Auto-assign to creating admin
      })
      .select(`
        *,
        reporter:users!reported_by(id, full_name, email),
        property:properties(id, title),
        reported_user:users!user_id(id, full_name, email)
      `)
      .single();

    if (createError) {
      console.error('Fraud report creation error:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create fraud report',
        message: createError.message
      }, { status: 500 });
    }

    const response: ApiResponse<FraudReport> = {
      success: true,
      data: newReport as FraudReport,
      message: 'Fraud report created successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Admin fraud report creation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
