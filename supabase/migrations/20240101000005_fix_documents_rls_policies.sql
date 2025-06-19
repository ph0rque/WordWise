-- Migration: Fix RLS policies for existing documents table
-- This migration fixes the Row Level Security policies to allow document creation
-- Updated to work with the user_roles table structure

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Students can read own documents" ON documents;
DROP POLICY IF EXISTS "Students can create own documents" ON documents;
DROP POLICY IF EXISTS "Students can update own documents" ON documents;
DROP POLICY IF EXISTS "Students can delete own documents" ON documents;
DROP POLICY IF EXISTS "allow_read_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_create_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_update_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_delete_own_documents" ON documents;

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies that work with user_roles table
CREATE POLICY "allow_read_own_documents" ON documents
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "allow_create_own_documents" ON documents
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "allow_update_own_documents" ON documents
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "allow_delete_own_documents" ON documents
    FOR DELETE USING (
        user_id = auth.uid() OR is_admin()
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add or replace the trigger for updating timestamps
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 