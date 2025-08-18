import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AdminStats, ApiResponse } from '@/types/enhanced';

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {

    // Get current date and start of month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all statistics in parallel
    const [
      usersStats,
      propertiesStats,
      bookingsStats,
      reviewsStats,
      fraudStats
    ] = await Promise.all([
      // Users statistics
      Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('account_status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')
      ]),

      // Properties statistics
      Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('properties').select('price').eq('status', 'active')
      ]),

      // Bookings statistics
      Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
      ]),

      // Reviews statistics
      Promise.all([
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('overall_rating').then(({ data }) => {
          const ratings = data?.map(r => r.overall_rating) || [];
          return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString())
      ]),

      // Fraud statistics
      Promise.all([
        supabase.from('fraud_reports').select('*', { count: 'exact', head: true }),
        supabase.from('fraud_reports').select('*', { count: 'exact', head: true }).eq('status', 'investigating'),
        supabase.from('fraud_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('account_status', 'suspended'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gt('fraud_score', 0.6)
      ])
    ]);

    // Construct the response
    const stats: AdminStats = {
      users: {
        total: usersStats[0].count || 0,
        active: usersStats[1].count || 0,
        landlords: usersStats[2].count || 0,
        tenants: usersStats[3].count || 0,
        new_this_month: usersStats[4].count || 0,
        verified: usersStats[5].count || 0
      },
      properties: {
        total: propertiesStats[0].count || 0,
        active: propertiesStats[1].count || 0,
        pending_verification: propertiesStats[2].count || 0,
        featured: propertiesStats[3].count || 0,
        new_this_month: propertiesStats[4].count || 0,
        average_price: (() => {
          const prices = propertiesStats[5].data?.map((p: any) => p.price) || [];
          return prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
        })()
      },
      bookings: {
        total: bookingsStats[0].count || 0,
        pending: bookingsStats[1].count || 0,
        confirmed: bookingsStats[2].count || 0,
        completed: bookingsStats[3].count || 0,
        cancelled: bookingsStats[4].count || 0,
        new_this_month: bookingsStats[5].count || 0
      },
      reviews: {
        total: reviewsStats[0].count || 0,
        average_rating: Number(reviewsStats[1]) || 0,
        pending_moderation: reviewsStats[2].count || 0,
        flagged: reviewsStats[3].count || 0,
        new_this_month: reviewsStats[4].count || 0
      },
      fraud: {
        reports: fraudStats[0].count || 0,
        investigations: fraudStats[1].count || 0,
        resolved: fraudStats[2].count || 0,
        flagged_users: fraudStats[3].count || 0,
        flagged_properties: fraudStats[4].count || 0
      }
    };

    const response: ApiResponse<AdminStats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
