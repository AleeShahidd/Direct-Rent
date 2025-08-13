import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// PUT - Update booking status and response
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { status, landlord_response, user_id } = body;

    // Validation
    if (!status || !['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, accepted, rejected, withdrawn)' },
        { status: 400 }
      );
    }

    // Get the booking to verify permissions
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(landlord_id)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authorization check
    const isLandlord = booking.property.landlord_id === user_id;
    const isTenant = booking.user_id === user_id;

    if (!isLandlord && !isTenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only landlords can accept/reject, only tenants can withdraw
    if (isLandlord && status === 'withdrawn') {
      return NextResponse.json(
        { error: 'Landlords cannot withdraw bookings' },
        { status: 403 }
      );
    }

    if (isTenant && (status === 'accepted' || status === 'rejected')) {
      return NextResponse.json(
        { error: 'Tenants cannot accept or reject bookings' },
        { status: 403 }
      );
    }

    // Update the booking
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (landlord_response) {
      updateData.landlord_response = landlord_response;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select(`
        *,
        property:properties(id, title, address, city),
        user:users(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // TODO: Send notification to relevant party (email/push notification)

    return NextResponse.json(updatedBooking);

  } catch (error) {
    console.error('Error in PUT /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get specific booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(
          id, title, address, city, price, bedrooms, bathrooms, property_type,
          landlord:users(id, first_name, last_name, email, phone)
        ),
        user:users(id, first_name, last_name, email, phone)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cancel/delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the booking to verify permissions
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(landlord_id)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authorization - only the tenant who made the inquiry can delete it
    if (booking.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Booking deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
