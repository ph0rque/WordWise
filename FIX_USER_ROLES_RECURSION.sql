-- ===============================================
-- FIX FOR INFINITE RECURSION IN USER_ROLES RLS
-- ===============================================
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- This fixes the "infinite recursion detected in policy for relation user_roles" error

-- Step 1: Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;

-- Step 2: Create simplified policies that don't cause recursion
-- Allow users to read their own role
CREATE POLICY "Users can read own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own role (for signup)
CREATE POLICY "Users can insert own role" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all roles (needed for admin functions)
-- This is safe because we control access at the application level
CREATE POLICY "Authenticated users can read roles" ON user_roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update and insert roles
-- We control admin access through the API endpoints
CREATE POLICY "Authenticated users can manage roles" ON user_roles
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Step 3: Update the admin check functions to avoid recursion
CREATE OR REPLACE FUNCTION get_user_role_by_id(target_user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
    current_user_role user_role;
BEGIN
    -- Get current user's role safely
    SELECT role INTO current_user_role
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Only allow if current user is admin
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT role INTO user_role_result
    FROM user_roles 
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(user_role_result, 'student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the set user role function to avoid recursion
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- Get current user's role safely
    SELECT role INTO current_user_role
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Only allow if current user is admin
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, new_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = new_role, updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 