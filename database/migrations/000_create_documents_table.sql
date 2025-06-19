-- Migration: Create documents table
-- This migration creates the documents table with proper RLS policies

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            (raw_user_meta_data->>'role')::text = 'admin',
            false
        )
        FROM auth.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for documents table
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

-- Grant necessary permissions
GRANT ALL ON documents TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE documents IS 'User documents for the WordWise application';
COMMENT ON COLUMN documents.user_id IS 'References the user who owns this document';
COMMENT ON COLUMN documents.title IS 'Document title, defaults to "Untitled Document"';
COMMENT ON COLUMN documents.content IS 'Document content in plain text'; 