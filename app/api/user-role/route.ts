import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', role: null },
        { status: 401 }
      )
    }

    // Try to get role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // If role query fails, default to student
    const role = roleData?.role || 'student'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      error: null
    })

  } catch (error) {
    console.error('Error in user-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error', role: null },
      { status: 500 }
    )
  }
} 