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

export async function DELETE(
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

    // Check if user is a student
    const userRole = await getUserRoleFromDB(user.id)
    if (userRole !== 'student') {
      return NextResponse.json({ error: 'Only students can remove coaches' }, { status: 403 })
    }

    const coachId = params.id

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID required' }, { status: 400 })
    }

    // Use service role client for operations
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // Remove the coach from student's metadata
    const currentCoaches = user.user_metadata?.coaches || []
    const updatedCoaches = currentCoaches.filter((coach: any) => coach.id !== coachId)

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        coaches: updatedCoaches
      }
    })

    if (updateError) {
      console.error('Error updating student metadata:', updateError)
      return NextResponse.json({ error: 'Failed to remove coach' }, { status: 500 })
    }

    // Also remove the student from coach's metadata
    const { data: { user: coachUser }, error: coachError } = await supabaseAdmin.auth.admin.getUserById(coachId)
    
    if (!coachError && coachUser) {
      const currentStudents = coachUser.user_metadata?.students || []
      const updatedStudents = currentStudents.filter((student: any) => student.id !== user.id)

      await supabaseAdmin.auth.admin.updateUserById(coachId, {
        user_metadata: {
          ...(coachUser.user_metadata || {}),
          students: updatedStudents
        }
      })
    }

    return NextResponse.json({
      message: 'Coach removed successfully'
    })

  } catch (error) {
    console.error('Remove coach API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 