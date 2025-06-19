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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find the user by email
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const targetUser = authUsers.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found',
        message: `No user found with email "${email}". They need to sign up to WordWise first.`
      }, { status: 404 })
    }

    // Check if user already has a role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUser.id)
      .single()

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing role:', roleCheckError)
      return NextResponse.json({ error: 'Failed to check user role' }, { status: 500 })
    }

    if (existingRole) {
      if (existingRole.role === 'student') {
        return NextResponse.json({ 
          error: 'User already has student role',
          message: `User "${email}" is already a student.`
        }, { status: 409 })
      } else {
        return NextResponse.json({ 
          error: 'User has different role',
          message: `User "${email}" already has the role "${existingRole.role}".`
        }, { status: 409 })
      }
    }

    // Assign student role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUser.id,
        role: 'student'
      })

    if (roleError) {
      console.error('Error assigning student role:', roleError)
      return NextResponse.json({ error: 'Failed to assign student role' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Student role assigned successfully',
      student: {
        id: targetUser.id,
        email: targetUser.email,
        role: 'student',
        created_at: targetUser.created_at,
        email_confirmed_at: targetUser.email_confirmed_at,
        last_sign_in_at: targetUser.last_sign_in_at,
        user_metadata: targetUser.user_metadata,
        has_consented_to_keystrokes: targetUser.user_metadata?.has_consented_to_keystrokes || false
      }
    })

  } catch (error) {
    console.error('Assign student role API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 