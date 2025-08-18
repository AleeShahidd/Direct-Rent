import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Property, SearchFilters, PaginatedResponse, ApiResponse } from '@/types/enhanced';
import { googleMapsService } from '@/lib/google-maps';

// GET /api/properties - Get properties with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      postcode: searchParams.get('postcode') || undefined,
      city: searchParams.get('city') || undefined,
      county: searchParams.get('county') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      property_type: searchParams.get('property_type') ? searchParams.get('property_type')?.split(',') : undefined,
      bedrooms: searchParams.get('bedrooms') ? searchParams.get('bedrooms')?.split(',').map(Number) : undefined,
      bathrooms: searchParams.get('bathrooms') ? searchParams.get('bathrooms')?.split(',').map(Number) : undefined,
      furnishing_status: searchParams.get('furnishing_status') ? searchParams.get('furnishing_status')?.split(',') : undefined,
      available_from: searchParams.get('available_from') || undefined,
      pets_allowed: searchParams.get('pets_allowed') === 'true',
      parking_required: searchParams.get('parking_required') === 'true',
      garden_required: searchParams.get('garden_required') === 'true',
      smoking_allowed: searchParams.get('smoking_allowed') === 'true',
      students_allowed: searchParams.get('students_allowed') === 'true',
      dss_accepted: searchParams.get('dss_accepted') === 'true',
      couples_allowed: searchParams.get('couples_allowed') === 'true',
      bills_included: searchParams.get('bills_included') === 'true',
      epc_rating: searchParams.get('epc_rating') ? searchParams.get('epc_rating')?.split(',') : undefined,
      council_tax_band: searchParams.get('council_tax_band') ? searchParams.get('council_tax_band')?.split(',') : undefined,
      amenities: searchParams.get('amenities') ? searchParams.get('amenities')?.split(',') : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'newest',
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
      latitude: searchParams.get('latitude') ? Number(searchParams.get('latitude')) : undefined,
      longitude: searchParams.get('longitude') ? Number(searchParams.get('longitude')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      verified_only: searchParams.get('verified_only') === 'true',
      featured_only: searchParams.get('featured_only') === 'true'
    };

    // Build the query with flexible field names for name/full_name
    let query = supabase
      .from('properties')
      .select(`
        *      `)
      .eq('status', 'active');

    // Apply verification filter
    if (filters.verified_only) {
      query = query.eq('verification_status', 'verified');
    }

    // Apply featured filter
    if (filters.featured_only) {
      query = query.eq('featured', true);
    }

    // Apply text search
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
    }

    // Apply location filters
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.county) {
      query = query.ilike('county', `%${filters.county}%`);
    }
    if (filters.postcode) {
      query = query.ilike('postcode', `%${filters.postcode}%`);
    }

    // Apply price filters
    if (filters.min_price) {
      query = query.gte('rent_amount', filters.min_price);
    }
    if (filters.max_price) {
      query = query.lte('rent_amount', filters.max_price);
    }

    // Apply property type filter
    if (filters.property_type && filters.property_type.length > 0) {
      query = query.in('property_type', filters.property_type);
    }

    // Apply bedroom filter
    if (filters.bedrooms && filters.bedrooms.length > 0) {
      query = query.in('bedrooms', filters.bedrooms);
    }

    // Apply bathroom filter
    if (filters.bathrooms && filters.bathrooms.length > 0) {
      query = query.in('bathrooms', filters.bathrooms);
    }

    // Apply furnishing status filter
    if (filters.furnishing_status && filters.furnishing_status.length > 0) {
      query = query.in('furnishing_status', filters.furnishing_status);
    }

    // Apply availability filter
    if (filters.available_from) {
      query = query.lte('available_from', filters.available_from);
    }

    // Apply boolean filters
    if (filters.pets_allowed) {
      query = query.eq('pets_allowed', true);
    }
    if (filters.parking_required) {
      query = query.gt('parking_spaces', 0);
    }
    if (filters.garden_required) {
      query = query.eq('has_garden', true);
    }
    if (filters.smoking_allowed) {
      query = query.eq('smoking_allowed', true);
    }
    if (filters.students_allowed) {
      query = query.eq('students_allowed', true);
    }
    if (filters.dss_accepted) {
      query = query.eq('dss_accepted', true);
    }
    if (filters.couples_allowed) {
      query = query.eq('couples_allowed', true);
    }
    if (filters.bills_included) {
      query = query.eq('bills_included', true);
    }

    // Apply EPC rating filter
    if (filters.epc_rating && filters.epc_rating.length > 0) {
      query = query.in('epc_rating', filters.epc_rating);
    }

    // Apply council tax band filter
    if (filters.council_tax_band && filters.council_tax_band.length > 0) {
      query = query.in('council_tax_band', filters.council_tax_band);
    }

    // Apply sorting
    switch (filters.sort_by) {
      case 'price_low':
        query = query.order('rent_amount', { ascending: true });
        break;
      case 'price_high':
        query = query.order('rent_amount', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_viewed':
        query = query.order('view_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const from = (filters.page! - 1) * filters.limit!;
    const to = from + filters.limit! - 1;
    query = query.range(from, to);

    const { data: properties, error, count } = await query;

    if (error) {
      console.log('Properties query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch properties',
        message: error.message
      }, { status: 500 });
    }

    // Apply distance filtering if location coordinates provided
    let filteredProperties = properties || [];
    if (filters.latitude && filters.longitude && filters.radius) {
      filteredProperties = await googleMapsService.getPropertiesWithinRadius(
        filters.latitude,
        filters.longitude,
        filters.radius,
        filteredProperties
      );
    }

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / filters.limit!);
    const hasNext = filters.page! < totalPages;
    const hasPrev = filters.page! > 1;

    const response: PaginatedResponse<Property> = {
      data: filteredProperties,
      pagination: {
        total: totalCount,
        page: filters.page!,
        limit: filters.limit!,
        totalPages,
        hasNext,
        hasPrev
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.log('Properties API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/properties - Create a new property listing
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

    // Check if user is a landlord
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'landlord') {
      return NextResponse.json({
        success: false,
        error: 'Only landlords can create properties'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      property_type,
      bedrooms,
      bathrooms,
      rent_amount,
      deposit_amount,
      service_charges,
      furnishing_status,
      available_from,
      minimum_tenancy_months,
      maximum_tenancy_months,
      pets_allowed,
      smoking_allowed,
      couples_allowed,
      students_allowed,
      dss_accepted,
      professionals_only,
      address_line_1,
      address_line_2,
      city,
      county,
      postcode,
      epc_rating,
      council_tax_band,
      council_tax_included,
      bills_included,
      parking_spaces,
      has_garden,
      has_balcony,
      has_terrace,
      amenities,
      virtual_tour_url,
      floor_plan_url,
      images
    } = body;

    // Validate required fields
    if (!title || !description || !property_type || !bedrooms || !bathrooms || 
        !rent_amount || !deposit_amount || !furnishing_status || !address_line_1 || 
        !city || !county || !postcode) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Geocode the address
    let latitude, longitude;
    try {
      const geocodeResult = await googleMapsService.geocodePostcode(postcode);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }
    } catch (geocodeError) {
      console.warn('Geocoding failed:', geocodeError);
    }

    // Insert property
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        title,
        description,
        property_type,
        bedrooms,
        bathrooms,
        rent_amount,
        deposit_amount,
        service_charges: service_charges || 0,
        furnishing_status,
        available_from,
        minimum_tenancy_months: minimum_tenancy_months || 6,
        maximum_tenancy_months,
        pets_allowed: pets_allowed || false,
        smoking_allowed: smoking_allowed || false,
        couples_allowed: couples_allowed !== false,
        students_allowed: students_allowed !== false,
        dss_accepted: dss_accepted || false,
        professionals_only: professionals_only || false,
        address_line_1,
        address_line_2,
        city,
        county,
        postcode,
        latitude,
        longitude,
        epc_rating,
        council_tax_band,
        council_tax_included: council_tax_included || false,
        bills_included: bills_included || false,
        parking_spaces: parking_spaces || 0,
        has_garden: has_garden || false,
        has_balcony: has_balcony || false,
        has_terrace: has_terrace || false,
        amenities: amenities || [],
        virtual_tour_url,
        floor_plan_url,
        landlord_id: user.id,
        status: 'pending_approval',
        verification_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.log('Property creation error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create property',
        message: error.message
      }, { status: 500 });
    }

    // Call ML API for fraud detection
    try {
      const fraudCheckRequest = {
        property: property,
        landlord_id: property.landlord_id
      };

      const fraudResponse = await fetch(`${process.env.ML_API_URL || 'http://localhost:8000'}/fraud-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_data: {
            title: property.title,
            description: property.description,
            price_per_month: property.price_per_month,
            postcode: property.postcode,
            property_type: property.property_type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            images: property.images || []
          },
          landlord_id: property.landlord_id
        }),
      });

      if (fraudResponse.ok) {
        const fraudData = await fraudResponse.json();
        
        // Store fraud check results
        const { error: fraudInsertError } = await supabase
          .from('fraud_reports')
          .insert({
            property_id: property.id,
            landlord_id: property.landlord_id,
            fraud_score: fraudData.fraud_score,
            is_fraudulent: fraudData.is_fraudulent,
            reasons: fraudData.reasons,
            risk_factors: fraudData.risk_factors,
            status: fraudData.is_fraudulent ? 'pending' : 'approved'
          });

        if (fraudInsertError) {
          console.log('Failed to store fraud report:', fraudInsertError);
        }

        // If high fraud risk, mark property as pending approval
        if (fraudData.is_fraudulent) {
          await supabase
            .from('properties')
            .update({ 
              status: 'pending_approval',
              admin_notes: `Flagged by fraud detection (score: ${fraudData.fraud_score})`
            })
            .eq('id', property.id);
        }
      }
    } catch (fraudError) {
      console.log('Fraud detection failed:', fraudError);
      // Continue without blocking property creation
    }

    const response: ApiResponse<Property> = {
      success: true,
      data: property,
      message: 'Property created successfully',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.log('Property creation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
