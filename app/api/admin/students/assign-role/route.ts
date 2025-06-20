import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from '@/lib/supabase/server'

// Helper function to get user role from database using service role to bypass RLS
async function getUserRoleFromDB(userId: string): Promise<string | null> {
  console.log('🔍 getUserRoleFromDB called for userId:', userId)
  
  if (!supabaseAdmin) {
    console.error('❌ Admin client not available')
    return null
  }

  console.log('✅ Admin client available, querying user_roles table...')
  const { data: roleData, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    console.error('❌ Error fetching user role:', error)
    return null
  }
  
  console.log('✅ Role data retrieved:', roleData)
  return roleData?.role || null
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Admin assign-role API called')
    const supabase = await createClient()
    
    // Check if user is authenticated
    console.log('🔍 Checking user authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.email, 'ID:', user.id)

    // Check if user is admin using service role to bypass RLS
    console.log('🔍 Checking if user is admin...')
    const userRole = await getUserRoleFromDB(user.id)
    console.log('📋 User role result:', userRole)
    
    if (userRole !== 'admin') {
      console.error('❌ Admin access denied. User role:', userRole, 'Expected: admin')
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin access confirmed')

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use service role client for admin operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // Find the user by email using admin client
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
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

    // Check if user already has a role using admin client to bypass RLS
    const { data: existingRole, error: roleCheckError } = await supabaseAdmin
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

    // Assign student role using admin client to bypass RLS
    const { error: roleError } = await supabaseAdmin
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