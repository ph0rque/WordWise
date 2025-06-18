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

    // For updating user metadata, we need to use the Admin API
    // Since we don't have the service role key, let's return instructions for client-side update
    console.log('Role assignment request:', { userId, role })
    
    // Verify the user is authenticated by checking their token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user || user.id !== userId) {
      console.error('User verification failed:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Since updateUser() must be called client-side, return success and let client handle it
    console.log('User verified, returning success for client-side update')
    return NextResponse.json({ 
      success: true, 
      role,
      message: 'User verified, proceed with client-side update'
    })
  } catch (error) {
    console.error('Error in assign-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 