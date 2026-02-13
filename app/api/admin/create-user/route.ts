import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify caller is an authenticated admin
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role client to bypass RLS and create the auth user
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  const { email, password, name } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'Email, password and name are required' },
      { status: 400 }
    )
  }

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email confirmation for admin-created accounts
  })

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user' },
      { status: 400 }
    )
  }

  // Insert profile record
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUser.user.id,
    email,
    name,
    role: 'driver',
  })

  if (profileError) {
    console.error('Profile error:', profileError)
    return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
  }

  return NextResponse.json({ id: newUser.user.id })
}
