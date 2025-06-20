import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing userId or role' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['student', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    console.log('Role assignment request:', { userId, role })
    
    // Create Supabase client with service role key for database operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      // Fallback: Use anon key and let RLS policies handle authorization
      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )
      
      // Verify the user token first
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        console.error('Authentication failed:', authError)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Verify the user is trying to assign role to themselves (for security)
      if (user.id !== userId) {
        console.error('User trying to assign role to different user:', { currentUser: user.id, targetUser: userId })
        return NextResponse.json(
          { error: 'Can only assign role to yourself' },
          { status: 403 }
        )
      }

      // Insert into user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        }, {
          onConflict: 'user_id'
        })

      if (roleError) {
        console.error('Error inserting into user_roles table:', roleError)
        return NextResponse.json(
          { error: 'Failed to assign role', details: roleError.message },
          { status: 500 }
        )
      }

      console.log(`Successfully assigned ${role} role to user ${userId}`)
      return NextResponse.json({ 
        success: true, 
        role,
        message: `Successfully assigned ${role} role`
      })
    } else {
      // Use service role for admin operations
      const supabase = createClient(
        supabaseUrl,
        serviceRoleKey
      )

      // Insert into user_roles table (bypasses RLS with service role)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        }, {
          onConflict: 'user_id'
        })

      if (roleError) {
        console.error('Error inserting into user_roles table:', roleError)
        return NextResponse.json(
          { error: 'Failed to assign role', details: roleError.message },
          { status: 500 }
        )
      }

      console.log(`Successfully assigned ${role} role to user ${userId}`)
      return NextResponse.json({ 
        success: true, 
        role,
        message: `Successfully assigned ${role} role`
      })
    }
  } catch (error) {
    console.error('Error in assign-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 