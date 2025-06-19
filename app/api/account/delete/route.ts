import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Try to get the authorization token from the header
    const authHeader = request.headers.get('authorization')
    let user = null
    let userError = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data, error } = await supabase.auth.getUser(token)
      user = data.user
      userError = error
    } else {
      // Fallback to session-based auth
      const { data, error } = await supabase.auth.getUser()
      user = data.user
      userError = error
    }
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse the confirmation from request body
    const body = await request.json()
    const { confirmation } = body

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Invalid confirmation. Please type DELETE to confirm." },
        { status: 400 }
      )
    }

    // Delete all user documents first
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', user.id)

    if (documentsError) {
      console.error("Error deleting user documents:", documentsError)
      // Continue with account deletion even if document deletion fails
    }

    // Delete any keystroke recordings
    const { error: keystrokeError } = await supabase
      .from('keystroke_recordings')
      .delete()
      .eq('user_id', user.id)

    if (keystrokeError) {
      console.error("Error deleting keystroke recordings:", keystrokeError)
      // Continue with account deletion
    }

    // Delete any chat sessions
    const { error: chatError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id)

    if (chatError) {
      console.error("Error deleting chat sessions:", chatError)
      // Continue with account deletion
    }

    // First sign out the user from their current session
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error("Error signing out user:", signOutError)
    }

    // Delete the user account using Admin API
    if (!supabaseAdmin) {
      console.error("Admin client not available - missing service role key")
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      )
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error("Error deleting user account:", deleteUserError)
      return NextResponse.json(
        { error: "Failed to delete user account. Please contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Account and all associated data have been deleted successfully." },
      { status: 200 }
    )

  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 