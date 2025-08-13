import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FraudReport, ApiResponse } from '@/types/enhanced';

// GET /api/admin/fraud-reports/[id] - Get specific fraud report
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

    const reportId = id;

    // Get fraud report with detailed information
    const { data: report, error } = await supabase
      .from('fraud_reports')
      .select(`
        *,
        reporter:users!reported_by(id, full_name, email, phone),
        property:properties(
          id, title, description, price, location_address,
          landlord:users(id, full_name, email)
        ),
        reported_user:users!user_id(
          id, full_name, email, phone, account_status,
          properties:properties(count),
          reviews:reviews(count)
        ),
        assigned_admin:users!assigned_to(id, full_name, email)
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({
        success: false,
        error: 'Fraud report not found'
      }, { status: 404 });
    }

    const response: ApiResponse<FraudReport> = {
      success: true,
      data: report as FraudReport,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin fraud report details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/admin/fraud-reports/[id] - Update fraud report
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

    const reportId = id;
    const body = await request.json();

    // Extract updatable fields
    const updateData: any = {};
    const allowedFields = [
      'status', 'priority', 'assigned_to', 'resolution_notes',
      'action_taken', 'evidence_urls'
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

    // Add resolved_at timestamp if status is being set to resolved
    if (updateData.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    // Update fraud report
    const { data: updatedReport, error } = await supabase
      .from('fraud_reports')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select(`
        *,
        reporter:users!reported_by(id, full_name, email),
        property:properties(id, title),
        reported_user:users!user_id(id, full_name, email),
        assigned_admin:users!assigned_to(id, full_name)
      `)
      .single();

    if (error) {
      console.error('Fraud report update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update fraud report',
        message: error.message
      }, { status: 500 });
    }

    // If taking action on property or user, update their status
    if (updateData.action_taken && updateData.status === 'resolved') {
      const { property_id, user_id } = updatedReport;
      
      if (property_id && updateData.action_taken.includes('property')) {
        await supabase
          .from('properties')
          .update({ 
            status: updateData.action_taken.includes('remove') ? 'inactive' : 'under_review'
          })
          .eq('id', property_id);
      }

      if (user_id && updateData.action_taken.includes('user')) {
        await supabase
          .from('users')
          .update({ 
            account_status: updateData.action_taken.includes('suspend') ? 'suspended' : 'under_review'
          })
          .eq('id', user_id);
      }
    }

    const response: ApiResponse<FraudReport> = {
      success: true,
      data: updatedReport as FraudReport,
      message: 'Fraud report updated successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin fraud report update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/admin/fraud-reports/[id] - Delete fraud report
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

    const reportId = id;

    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabase
      .from('fraud_reports')
      .select('id, report_type, status')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json({
        success: false,
        error: 'Fraud report not found'
      }, { status: 404 });
    }

    // Only allow deletion of dismissed reports
    if (existingReport.status !== 'dismissed') {
      return NextResponse.json({
        success: false,
        error: 'Only dismissed reports can be deleted'
      }, { status: 400 });
    }

    // Delete fraud report
    const { error: deleteError } = await supabase
      .from('fraud_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('Fraud report deletion error:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete fraud report',
        message: deleteError.message
      }, { status: 500 });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: reportId },
      message: 'Fraud report deleted successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin fraud report deletion API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
