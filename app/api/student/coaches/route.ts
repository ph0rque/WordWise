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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a student
    const userRole = await getUserRoleFromDB(user.id)
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Only students can add coaches' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName, mode } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use service role client for operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    let coachUserId: string
    let coachUser: any

    if (mode === 'existing') {
      // Find existing user by email
      const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      const targetUser = authUsers.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!targetUser) {
        return NextResponse.json({ 
          error: 'User not found',
          message: `No user found with email "${email}". They need to sign up to WordWise first, or you can create a new account for them.`
        }, { status: 404 })
      }

      // Check if user already has admin role
      const existingRole = await getUserRoleFromDB(targetUser.id)
      
      if (!existingRole) {
        // Assign admin role if no role exists
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: targetUser.id,
            role: 'admin'
          })

        if (roleError) {
          console.error('Error assigning admin role:', roleError)
          return NextResponse.json({ error: 'Failed to assign coach role' }, { status: 500 })
        }
      } else if (existingRole !== 'admin') {
        return NextResponse.json({ 
          error: 'User has different role',
          message: `User "${email}" already has the role "${existingRole}". Coaches must have admin privileges.`
        }, { status: 409 })
      }

      coachUserId = targetUser.id
      coachUser = targetUser
    } else {
      // Create new coach account
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new accounts' }, { status: 400 })
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim() || email,
          role: 'coach' // Store in metadata for UI purposes
        },
        email_confirm: true
      })

      if (createError) {
        console.error('Error creating coach:', createError)
        return NextResponse.json({ error: 'Failed to create coach account' }, { status: 500 })
      }

      if (!newUser.user) {
        return NextResponse.json({ error: 'Coach creation failed' }, { status: 500 })
      }

      // Assign admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'admin'
        })

      if (roleError) {
        console.error('Error assigning admin role:', roleError)
        // Clean up created user if role assignment fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        return NextResponse.json({ error: 'Failed to assign coach role' }, { status: 500 })
      }

      coachUserId = newUser.user.id
      coachUser = newUser.user
    }

    // Store the student-coach relationship in the student's user metadata
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        coaches: [
          ...((user.user_metadata?.coaches || []).filter((c: any) => c.id !== coachUserId)),
          {
            id: coachUserId,
            email: coachUser.email,
            name: coachUser.user_metadata?.full_name || coachUser.email,
            added_at: new Date().toISOString()
          }
        ]
      }
    })

    if (updateError) {
      console.error('Error updating student metadata:', updateError)
      // Don't fail the request, just log the error
    }

    // Also store the relationship in the coach's metadata
    const { error: coachUpdateError } = await supabaseAdmin.auth.admin.updateUserById(coachUserId, {
      user_metadata: {
        ...(coachUser.user_metadata || {}),
        students: [
          ...((coachUser.user_metadata?.students || []).filter((s: any) => s.id !== user.id)),
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            added_at: new Date().toISOString()
          }
        ]
      }
    })

    if (coachUpdateError) {
      console.error('Error updating coach metadata:', coachUpdateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: mode === 'existing' ? 'Coach added successfully' : 'Coach created and added successfully',
      coach: {
        id: coachUserId,
        email: coachUser.email,
        role: 'admin',
        name: coachUser.user_metadata?.full_name || coachUser.email,
        created_at: coachUser.created_at,
        email_confirmed_at: coachUser.email_confirmed_at
      }
    })

  } catch (error) {
    console.error('Add coach API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 