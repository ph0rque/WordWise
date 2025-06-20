import { NextRequest, NextResponse } from 'next/server'
import { createClient, supabaseAdmin } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    // Try to get user from auth header first (for session-based requests)
    const authHeader = request.headers.get('Authorization')
    let user = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data, error } = await supabase.auth.getUser(token)
      if (!error && data.user) {
        user = data.user
      }
    }
    
    // If no auth header or token invalid, try regular getUser
    if (!user) {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = data.user
    }

    console.log('Deleting account for user:', user.id)

    // Get the confirmation from request body
    const body = await request.json()
    const { confirmation } = body

    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    // Delete user data in order (respecting foreign key constraints)
    
    // 1. Delete user documents
    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', user.id)
    
    if (docsError) {
      console.error('Error deleting user documents:', docsError)
      // Continue with deletion even if documents fail
    }

    // 2. Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError)
      // Continue with deletion even if roles fail
    }

    // 3. Delete chat sessions
    const { error: chatError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id)
    
    if (chatError) {
      console.error('Error deleting chat sessions:', chatError)
      // Continue with deletion even if chat sessions fail
    }

    // 4. Delete keystroke recordings if they exist
    try {
      const { error: keystrokeError } = await supabase
        .from('keystroke_recordings')
        .delete()
        .eq('user_id', user.id)
      
      if (keystrokeError) {
        console.error('Error deleting keystroke recordings:', keystrokeError)
        // Continue with deletion even if keystroke recordings fail
      }
    } catch (error) {
      // Table might not exist, ignore
      console.log('Keystroke recordings table not found, skipping')
    }

    // 5. Finally, delete the user account using admin client
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 })
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError)
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
    }

    console.log('Successfully deleted account for user:', user.id)
    
    return NextResponse.json({ 
      message: 'Account deleted successfully',
      userId: user.id 
    })
    
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 