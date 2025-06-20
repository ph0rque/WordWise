import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'

// Helper function to get user role from database using service role to bypass RLS
async function getUserRoleFromDB(userId: string): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error('Admin client not available')
    return null
  }

  const { data: roleData, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    console.error('Error fetching user role:', error)
    return null
  }
  
  return roleData?.role || null
}

interface StudentRole {
  user_id: string
  role: string
  created_at: string
}

interface AuthUser {
  id: string
  email?: string
  created_at?: string
  email_confirmed_at?: string
  last_sign_in_at?: string
  user_metadata?: any
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using service role to bypass RLS
    const userRole = await getUserRoleFromDB(user.id)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Use service role client for admin operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // Get all students from auth.users with role metadata
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get user roles from database using admin client to bypass RLS
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'student')

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
    }

    // Create a map of user_id to role for quick lookup
    const roleMap = new Map(userRoles.map((r: any) => [r.user_id, r.role]))

    // Filter users to only include students
    const students = authUsers.users
      .filter((user: any) => roleMap.get(user.id) === 'student')
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        role: 'student',
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata,
        has_consented_to_keystrokes: user.user_metadata?.has_consented_to_keystrokes || false
      }))

    return NextResponse.json({
      students,
      total: students.length
    })

  } catch (error) {
    console.error('Get students API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using service role to bypass RLS
    const userRole = await getUserRoleFromDB(user.id)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Use service role client for admin operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim() || email
      },
      email_confirm: true // Skip email confirmation for admin-created users
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Assign student role using admin client to bypass RLS
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'student'
      })

    if (roleError) {
      console.error('Error assigning student role:', roleError)
      // Try to clean up the created user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Failed to assign student role' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Student created successfully',
      student: {
        id: newUser.user.id,
        email: newUser.user.email,
        role: 'student',
        created_at: newUser.user.created_at,
        email_confirmed_at: newUser.user.email_confirmed_at,
        user_metadata: newUser.user.user_metadata,
        has_consented_to_keystrokes: false
      }
    })

  } catch (error) {
    console.error('Create student API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 