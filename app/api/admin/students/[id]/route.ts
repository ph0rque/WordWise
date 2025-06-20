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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const studentId = params.id

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Use service role client for admin operations to bypass RLS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // First, check if the user has a student role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', studentId)
      .eq('role', 'student')
      .single()

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get user details from auth.users using admin API
    const { data: { user: studentUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(studentId)

    if (userError || !studentUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Return student data in the expected format
    const student = {
      id: studentUser.id,
      email: studentUser.email,
      created_at: studentUser.created_at,
      email_confirmed_at: studentUser.email_confirmed_at,
      last_sign_in_at: studentUser.last_sign_in_at,
      role: 'student'
    }

    return NextResponse.json({ student })

  } catch (error) {
    console.error('Admin student detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 