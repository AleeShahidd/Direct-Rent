import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Exchange the code for a session
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
    }

    const { session, user } = data;

    if (user) {
      // Check if user exists in our users table
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error checking user:', userError);
      }

      // If user doesn't exist, create them with all required fields
      if (!existingUser) {
        // Get user's IP address for registration tracking
        let userIP = '';
        try {
          const forwardedFor = request.headers.get('x-forwarded-for');
          const realIP = request.headers.get('x-real-ip');
          const cfConnectingIP = request.headers.get('cf-connecting-ip');
          userIP = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || '';
        } catch (ipError) {
          console.warn('Could not fetch IP address:', ipError);
        }

        // Split full name into first and last name for OAuth users
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Use either full_name or name field based on schema
        let userData: any = {
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: user.user_metadata?.avatar_url,
          role: 'tenant', // Default role for OAuth users
          email_verified: user.email_confirmed_at ? true : false,
          phone_verified: false,
          verification_status: 'pending',
          account_status: 'active',
          registration_ip: userIP || null,
          last_login: new Date().toISOString(),
        };
        
        // Check if the schema uses 'full_name' or 'name'
        try {
          const { error: schemaCheckError } = await supabaseAdmin
            .from('users')
            .select('full_name')
            .limit(1);
            
          if (schemaCheckError && schemaCheckError.message?.includes('column "full_name" does not exist')) {
            // If full_name doesn't exist, use name
            userData.name = fullName;
          } else {
            // If full_name exists, use it
            userData.full_name = fullName;
          }
        } catch (schemaError) {
          console.error('Error checking schema:', schemaError);
          // Default to using both to be safe
          userData.name = fullName;
          userData.full_name = fullName;
        }

        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert(userData);

        if (insertError) {
          console.error('Error creating user:', insertError);
        }
      } else {
        // Update last login for existing users
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating last login:', updateError);
        }
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Unexpected error in callback:', error);
    return NextResponse.redirect(new URL('/auth/login?error=unexpected', request.url));
  }
}
