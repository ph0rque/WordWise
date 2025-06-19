-- Migration: Add user roles system for WordWise AI High School Student Edition
-- Uses a separate user_roles table instead of modifying auth.users

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Create user_roles table to store role information
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable Row Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table

-- Allow users to read their own role
CREATE POLICY "Users can read own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own role (for signup)
CREATE POLICY "Users can insert own role" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all user roles
CREATE POLICY "Admins can read all user roles" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to insert new user roles
CREATE POLICY "Admins can insert user roles" ON user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Return 'student' as default if no role found
    RETURN COALESCE(user_role_result, 'student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role by user ID (for admin operations)
CREATE OR REPLACE FUNCTION get_user_role_by_id(target_user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    -- Only allow if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT role INTO user_role_result
    FROM user_roles 
    WHERE user_id = target_user_id;
    
    RETURN COALESCE(user_role_result, 'student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set user role (for admin operations)
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow if current user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, new_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = new_role, updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing documents table to ensure proper RLS with roles
-- Students can only access their own documents
-- Admins can access all documents
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Students can read own documents" ON documents
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "Students can create own documents" ON documents
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Students can update own documents" ON documents
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "Students can delete own documents" ON documents
    FOR DELETE USING (
        user_id = auth.uid() OR is_admin()
    );

-- Comments for documentation
COMMENT ON TYPE user_role IS 'User roles for WordWise AI: student (default) and admin (teachers/administrators)';
COMMENT ON TABLE user_roles IS 'Stores user role assignments for WordWise AI application';
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role';
COMMENT ON FUNCTION get_user_role() IS 'Helper function to get current user role';
COMMENT ON FUNCTION get_user_role_by_id(UUID) IS 'Admin function to get any user role by ID';
COMMENT ON FUNCTION set_user_role(UUID, user_role) IS 'Admin function to set user role'; 