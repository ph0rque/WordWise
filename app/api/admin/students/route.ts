import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to get user role from database
async function getUserRoleFromDB(userId: string, supabase: any): Promise<string | null> {
  const { data: roleData, error } = await supabase
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
    const supabase = createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = await getUserRoleFromDB(user.id, supabase)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all students from user_roles table
    const { data: studentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('role', 'student')

    if (rolesError) {
      console.error('Error fetching student roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Get user details from auth.users using admin client
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 })
    }

    // Combine student role data with auth user data
    const students = studentRoles.map((studentRole: StudentRole) => {
      const authUser = authUsers.users.find((u: AuthUser) => u.id === studentRole.user_id)
      return {
        id: studentRole.user_id,
        email: authUser?.email || 'Unknown',
        role: studentRole.role,
        created_at: authUser?.created_at || studentRole.created_at,
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        user_metadata: authUser?.user_metadata || {},
        has_consented_to_keystrokes: authUser?.user_metadata?.has_consented_to_keystrokes || false
      }
    }).filter((student: any) => student.email !== 'Unknown') // Filter out students without email

    return NextResponse.json({ students })

  } catch (error) {
    console.error('Admin students API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = await getUserRoleFromDB(user.id, supabase)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Create new student user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName: firstName || '',
        lastName: lastName || '',
        has_consented_to_keystrokes: false
      }
    })

    if (createError) {
      console.error('Error creating student user:', createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Assign student role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'student'
      })

    if (roleError) {
      console.error('Error assigning student role:', roleError)
      // Try to delete the created user if role assignment fails
      await supabase.auth.admin.deleteUser(newUser.user.id)
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
        last_sign_in_at: null,
        user_metadata: newUser.user.user_metadata,
        has_consented_to_keystrokes: false
      }
    })

  } catch (error) {
    console.error('Create student API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 