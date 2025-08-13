import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    )
    
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // If user doesn't exist, create them with all required fields
      if (!existingUser) {
        // Get user's IP address for registration tracking
        let userIP = ''
        try {
          const forwardedFor = request.headers.get('x-forwarded-for')
          const realIP = request.headers.get('x-real-ip')
          const cfConnectingIP = request.headers.get('cf-connecting-ip')
          userIP = forwardedFor?.split(',')[0] || realIP || cfConnectingIP || ''
        } catch (ipError) {
          console.warn('Could not fetch IP address:', ipError)
        }

        // Split full name into first and last name for OAuth users
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
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
          })

        if (insertError) {
          console.error('Error creating user:', insertError)
        }
      } else {
        // Update last login for existing users
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
