import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { UserRole } from '@/lib/types'

let supabaseInstance: SupabaseClient | null = null

// Helper function to set cookies
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

// Helper function to delete cookies
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`
}

// Helper function to initialize cookies from existing session
async function initializeCookiesFromSession(client: SupabaseClient) {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (session?.access_token && session?.refresh_token) {
      setCookie('sb-access-token', session.access_token, 7)
      setCookie('sb-refresh-token', session.refresh_token, 7)
    }
  } catch (error) {
    console.warn('Failed to initialize cookies from session:', error)
  }
}

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })

  // Set up auth state change listener to manage cookies
  supabaseInstance.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.access_token && session?.refresh_token) {
        // Store tokens in cookies for server-side access
        setCookie('sb-access-token', session.access_token, 7)
        setCookie('sb-refresh-token', session.refresh_token, 7)
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear cookies on sign out
      deleteCookie('sb-access-token')
      deleteCookie('sb-refresh-token')
    }
  })

  // Initialize cookies from existing session (if any)
  if (typeof window !== 'undefined') {
    initializeCookiesFromSession(supabaseInstance)
  }

  return supabaseInstance
}

export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Enhanced Supabase client with role-based query helpers
 * Provides convenient methods for role-aware database operations
 */
export class SupabaseRoleClient {
  private client: SupabaseClient

  constructor() {
    this.client = getSupabaseClient()
  }

  /**
   * Get user documents with role-based access
   * Students see only their own documents, admins see all
   */
  async getUserDocuments(userId?: string) {
    let query = this.client
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })

    // If userId is provided (admin use case), filter by that user
    if (userId) {
      query = query.eq('user_id', userId)
    }
    // Otherwise, rely on RLS policies to filter appropriately

    return query
  }

  /**
   * Create a document (automatically sets user_id from auth context)
   */
  async createDocument(title: string, content: string = '') {
    const { data: { user } } = await this.client.auth.getUser()
    if (!user) {
      throw new Error('User must be authenticated to create documents')
    }

    return this.client
      .from('documents')
      .insert({
        title,
        content,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
  }

  /**
   * Update a document (RLS ensures proper access control)
   */
  async updateDocument(documentId: string, updates: { title?: string; content?: string }) {
    return this.client
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single()
  }

  /**
   * Delete a document (RLS ensures proper access control)
   */
  async deleteDocument(documentId: string) {
    return this.client
      .from('documents')
      .delete()
      .eq('id', documentId)
  }

  /**
   * Get all users with roles (admin only)
   * Uses proper API endpoints instead of direct table access
   */
  async getAllUsers() {
    // This should use API endpoints that properly handle authentication
    throw new Error('Use API endpoints for user management instead of direct client access')
  }

  /**
   * Update user role (admin only)
   * Uses proper API endpoints instead of direct table access
   */
  async updateUserRole(userId: string, role: UserRole) {
    // This should use API endpoints that properly handle authentication
    throw new Error('Use API endpoints for role management instead of direct client access')
  }

  /**
   * Get current user with role information
   */
  async getCurrentUserWithRole() {
    const { data: { user }, error: authError } = await this.client.auth.getUser()
    if (authError || !user) {
      return { data: null, error: authError }
    }

    // Query the user_roles table instead of auth.users
    const { data, error } = await this.client
      .from('user_roles')
      .select('role, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no role found, default to student
      if (error.code === 'PGRST116') {
        return {
          data: {
            id: user.id,
            email: user.email!,
            role: 'student' as UserRole,
            created_at: user.created_at,
            updated_at: user.created_at,
          },
          error: null
        }
      }
      return { data: null, error }
    }

    return {
      data: {
        id: user.id,
        email: user.email!,
        role: (data.role as UserRole) || 'student',
        created_at: user.created_at,
        updated_at: data.updated_at,
      },
      error: null
    }
  }

  /**
   * Check if current user has admin role
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    const { data } = await this.getCurrentUserWithRole()
    return data?.role === 'admin'
  }

  /**
   * Get the underlying Supabase client for direct access
   */
  get raw() {
    return this.client
  }
}

// Create and export a singleton instance
export const supabaseRoleClient = new SupabaseRoleClient()
