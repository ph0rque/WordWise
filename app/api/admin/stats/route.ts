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

export async function GET(request: NextRequest) {
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

    // Use service role client for admin operations to bypass RLS
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service client not available' }, { status: 500 })
    }

    // Get statistics using admin client to bypass RLS
    const [studentsResult, documentsResult, chatSessionsResult] = await Promise.all([
      supabaseAdmin.from('user_roles').select('*', { count: 'exact' }).eq('role', 'student'),
      supabaseAdmin.from('documents').select('*', { count: 'exact' }),
      supabaseAdmin.from('chat_sessions').select('*', { count: 'exact' })
    ])

    const stats = {
      totalStudents: studentsResult.count || 0,
      totalDocuments: documentsResult.count || 0,
      totalChatSessions: chatSessionsResult.count || 0,
      averageGrammarScore: 85, // Placeholder - could be calculated from actual data
      activeThisWeek: 0, // Placeholder - could be calculated from user activity
      // Add more statistics as needed
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 