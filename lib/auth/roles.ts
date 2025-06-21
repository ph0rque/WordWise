import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserRole, RolePermissions, UserWithRole, User } from '@/lib/types'
import { ROLE_PERMISSIONS } from '@/lib/types'



/**
 * Get the current user's role from the user_roles database table
 * This is optimized to use getCurrentUserWithRole internally to avoid duplicate queries
 * @returns Promise<UserRole | null> - The user's role or null if not authenticated
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const userWithRole = await getCurrentUserWithRole()
    return userWithRole?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Get the current user with role information using session data
 * This bypasses RLS issues by using the database function directly
 * @returns Promise<{ user: UserWithRole, session: any } | null> - User with role and session or null
 */
export async function getCurrentUserWithRoleFromSession(): Promise<{ user: UserWithRole, session: any } | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Get session (includes user data)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // If there's an actual error (not just null session), log it
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return null
    }
    
    // If no session or user, return null (this is normal during logout)
    if (!session?.user) {
      return null
    }

    const user = session.user

    // Use the database function to get role (bypasses RLS issues)
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role')
    
    if (roleError) {
      console.error('Error getting user role from database function:', roleError)
      // If the function fails, try direct query as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        // Default to student role if everything fails
        const role = 'student' as UserRole
        const permissions = ROLE_PERMISSIONS[role]

        console.log('getCurrentUserWithRoleFromSession debug (fallback to student):', {
          userId: user.id,
          email: user.email,
          role
        })

        const userWithRole: UserWithRole = {
          id: user.id,
          email: user.email!,
          role,
          permissions,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }

        return { user: userWithRole, session }
      }
      
      const role = fallbackData?.role as UserRole || 'student'
      const permissions = ROLE_PERMISSIONS[role]

      const userWithRole: UserWithRole = {
        id: user.id,
        email: user.email!,
        role,
        permissions,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }

      return { user: userWithRole, session }
    }
    
    const role = roleData as UserRole || 'student'
    const permissions = ROLE_PERMISSIONS[role]

    console.log('getCurrentUserWithRoleFromSession debug:', {
      userId: user.id,
      email: user.email,
      role
    })

    const userWithRole: UserWithRole = {
      id: user.id,
      email: user.email!,
      role,
      permissions,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    return { user: userWithRole, session }
  } catch (error) {
    console.error('Unexpected error getting user with role from session:', error)
    return null
  }
}

/**
 * Get the current user with role information
 * This is the primary function for getting user + role data with a single database query
 * @returns Promise<UserWithRole | null> - User with role and permissions or null
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  try {
    const result = await getCurrentUserWithRoleFromSession()
    return result?.user || null
  } catch (error) {
    console.error('Unexpected error getting user with role:', error)
    return null
  }
}

/**
 * Check if the current user has a specific role
 * @param requiredRole - The role to check for
 * @returns Promise<boolean> - True if user has the required role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole()
  return currentRole === requiredRole
}

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - True if user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return await hasRole('admin')
}

/**
 * Check if the current user is a student
 * @returns Promise<boolean> - True if user is a student
 */
export async function isCurrentUserStudent(): Promise<boolean> {
  return await hasRole('student')
}

/**
 * Check if the current user has a specific permission
 * @param permission - The permission key to check
 * @returns Promise<boolean> - True if user has the permission
 */
export async function hasPermission(
  permission: keyof RolePermissions
): Promise<boolean> {
  try {
    const userWithRole = await getCurrentUserWithRole()
    if (!userWithRole) return false
    
    return userWithRole.permissions[permission]
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Require a specific role for access (throws if not authorized)
 * @param requiredRole - The role required for access
 * @throws Error if user doesn't have required role
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  const hasRequiredRole = await hasRole(requiredRole)
  if (!hasRequiredRole) {
    throw new Error(`Access denied. Required role: ${requiredRole}`)
  }
}

/**
 * Require admin access (throws if not authorized)
 * @throws Error if user is not an admin
 */
export async function requireAdmin(): Promise<void> {
  await requireRole('admin')
}

/**
 * Require a specific permission for access (throws if not authorized)
 * @param permission - The permission key required
 * @throws Error if user doesn't have required permission
 */
export async function requirePermission(
  permission: keyof RolePermissions
): Promise<void> {
  const hasRequiredPermission = await hasPermission(permission)
  if (!hasRequiredPermission) {
    throw new Error(`Access denied. Required permission: ${permission}`)
  }
}

/**
 * Update a user's role (admin only)
 * Note: In production, this should be done via Supabase Admin API or database functions
 * @param userId - The ID of the user to update
 * @param newRole - The new role to assign
 * @returns Promise<boolean> - True if successful
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<boolean> {
  try {
    // First check if current user is admin
    await requireAdmin()
    
    // Note: Direct user metadata updates require admin privileges
    // In a production app, this should be done via:
    // 1. Supabase Admin API
    // 2. Database functions with elevated privileges
    // 3. Server-side API routes with admin SDK
    
    console.warn('updateUserRole: This function requires admin API access to modify user metadata')
    
    // For now, return false to indicate this operation is not available
    // In a real implementation, you would use the Supabase Admin SDK
    return false
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return false
  }
}

/**
 * Allows the current user to complete their own onboarding by setting their role and consent.
 * This should only be called during the initial setup flow.
 * @param role - The role to assign to the current user.
 * @param hasConsented - The keystroke recording consent status.
 */
export async function completeOnboarding(
  role: UserRole,
  hasConsented: boolean,
  name?: { firstName: string; lastName: string }
): Promise<{ user: User | null; error: any }> {
  try {
    const supabase = getSupabaseClient()
    
    // Get current user to check for existing display_name
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const existingDisplayName = currentUser?.user_metadata?.display_name
    
    if (!currentUser) {
      return { user: null, error: 'No authenticated user found' }
    }
    
    // Prepare update data (for user metadata - name and consent only)
    const updateData: any = {
      has_consented_to_keystrokes: hasConsented,
    }
    
    // If name is provided, use it to create/update display_name and individual name fields
    if (name) {
      updateData.first_name = name.firstName
      updateData.last_name = name.lastName
      updateData.display_name = `${name.firstName} ${name.lastName}`.trim()
    }
    // If no name provided but we have an existing display_name from signup, keep it
    else if (existingDisplayName) {
      updateData.display_name = existingDisplayName
    }
    
    // Save role to user_roles table FIRST (primary source of truth)
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: currentUser.id,
        role: role
      }, {
        onConflict: 'user_id'
      })

    if (roleError) {
      console.error('Error saving role to user_roles table:', roleError)
      return { user: null, error: roleError }
    }

    console.log(`Successfully assigned ${role} role to user ${currentUser.id} in user_roles table`)

    // Update user metadata (for name and consent only)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.updateUser({
      data: updateData,
    })

    if (userError) {
      console.error('Error updating user metadata:', userError)
      return { user: null, error: userError }
    }

    if (!user) {
      return { user: null, error: 'No user returned after update.' }
    }

    // Adapt Supabase user to our local User type
    const adaptedUser: User = {
      id: user.id,
      email: user.email || '', // Ensure email is always a string
    }

    return { user: adaptedUser, error: null }
  } catch (err) {
    console.error('Unexpected error in completeOnboarding:', err)
    return { user: null, error: err }
  }
}

/**
 * Get all users with their roles (admin only)
 * Note: In production, this requires admin API access or custom database views
 * @returns Promise<UserWithRole[]> - Array of users with role information
 */
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
  try {
    await requireAdmin()
    
    // Note: Getting all users requires admin privileges
    // In a production app, this should be done via:
    // 1. Supabase Admin API
    // 2. Custom database views with RLS policies
    // 3. Server-side API routes with admin SDK
    
    console.warn('getAllUsersWithRoles: This function requires admin API access')
    
    // Return mock data for development/testing
    const mockUsers: UserWithRole[] = [
      {
        id: 'mock-student-1',
        email: 'student1@example.com',
        role: 'student',
        permissions: ROLE_PERMISSIONS.student,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'mock-student-2',
        email: 'student2@example.com',
        role: 'student',
        permissions: ROLE_PERMISSIONS.student,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      {
        id: 'mock-admin-1',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ROLE_PERMISSIONS.admin,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]
    
    return mockUsers
  } catch (error) {
    console.error('Error in getAllUsersWithRoles:', error)
    return []
  }
}

/**
 * Simplified role checking utility for server-side use
 * @param request - The request object containing authorization header
 * @param requiredRole - The role required to access the resource
 * @returns Promise<{ authorized: boolean; user?: any; error?: string }>
 */
export async function checkRoleAuth(request: Request, requiredRole: UserRole) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return { authorized: false, error: 'No authorization header' }
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { authorized: false, error: 'Invalid token or user not found' }
    }

    // Check user role from database
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleError || !roleData) {
      return { authorized: false, error: 'No role assigned' }
    }
    
    const userRole = roleData.role as UserRole
    
    // Check if user has required role
    if (requiredRole === 'admin' && userRole !== 'admin') {
      return { authorized: false, error: 'Admin access required' }
    }

    return { authorized: true, user }
  } catch (error) {
    console.error('Role auth check error:', error)
    return { authorized: false, error: 'Internal server error' }
  }
} 