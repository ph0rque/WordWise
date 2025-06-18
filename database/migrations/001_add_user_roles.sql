-- Migration: Add user roles to auth.users table
-- This migration adds role-specific functionality for WordWise AI High School Student Edition

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Add role column to auth.users table (if using Supabase default auth)
-- Note: This extends the default Supabase auth.users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'student',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

-- Create Row Level Security (RLS) policies for role-based access

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON auth.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data (except role)
CREATE POLICY "Users can update own data" ON auth.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = OLD.role);

-- Allow admins to read all user data
CREATE POLICY "Admins can read all users" ON auth.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles" ON auth.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Enable RLS on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM auth.users 
        WHERE id = auth.uid()
    );
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
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role';
COMMENT ON FUNCTION get_user_role() IS 'Helper function to get current user role'; 