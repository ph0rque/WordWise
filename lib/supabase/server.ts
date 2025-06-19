import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// More robust environment variable handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Admin client for server-side operations (only create if we have the service key)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Server-side client with user authentication
export function createClient(cookieStore?: any) {
  // During build time, these might not be available
  if (!supabaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    } else {
      console.warn('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      // Return a mock client for build time
      return {
        auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
        from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
        rpc: () => Promise.resolve({ data: null, error: null })
      } as any
    }
  }
  
  if (!supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    } else {
      console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      // Return a mock client for build time
      return {
        auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
        from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
        rpc: () => Promise.resolve({ data: null, error: null })
      } as any
    }
  }

  // Create a standard client
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey)

  // If we have cookies, try to set the session
  if (cookieStore) {
    try {
      const refreshToken = cookieStore.get('sb-refresh-token')?.value
      const accessToken = cookieStore.get('sb-access-token')?.value
      
      if (refreshToken && accessToken) {
        // Set the session manually if we have tokens
        client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
      }
    } catch (error) {
      // Ignore errors during session setup
      console.warn('Could not set session from cookies:', error)
    }
  }

  return client
}
