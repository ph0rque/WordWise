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

    // Get all students count
    const { data: studentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student')

    if (rolesError) {
      console.error('Error fetching student roles:', rolesError)
    }

    const totalStudents = studentRoles?.length || 0

    // Get all documents count
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, user_id, created_at')

    if (docsError) {
      console.error('Error fetching documents:', docsError)
    }

    const totalDocuments = documents?.length || 0

    // Calculate students active this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get user auth data to check last sign in
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    let activeThisWeek = 0
         if (!usersError && authUsers && studentRoles) {
       const studentIds = new Set(studentRoles.map((role: any) => role.user_id))
       activeThisWeek = authUsers.users.filter((authUser: any) => 
         studentIds.has(authUser.id) &&
         authUser.last_sign_in_at && 
         new Date(authUser.last_sign_in_at) > oneWeekAgo
       ).length
     }

    // Calculate average grammar score (placeholder for now)
    // TODO: Implement real grammar score calculation from document analysis
    const averageGrammarScore = 85

    // Get keystroke recordings count (if table exists)
    let totalRecordings = 0
    try {
      const { data: recordings, error: recordingsError } = await supabase
        .from('keystroke_recordings')
        .select('id')

      if (!recordingsError && recordings) {
        totalRecordings = recordings.length
      }
    } catch (error) {
      // Table might not exist, ignore error
      console.log('Keystroke recordings table not available')
    }

    // Get chat sessions count (if table exists)
    let totalChatSessions = 0
    try {
      const { data: chatSessions, error: chatError } = await supabase
        .from('chat_sessions')
        .select('id')

      if (!chatError && chatSessions) {
        totalChatSessions = chatSessions.length
      }
    } catch (error) {
      // Table might not exist, ignore error
      console.log('Chat sessions table not available')
    }

    const stats = {
      totalStudents,
      totalDocuments,
      averageGrammarScore,
      activeThisWeek,
      totalRecordings,
      totalChatSessions,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 