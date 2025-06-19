-- Migration: Add keystroke recording consent tracking
-- This migration creates a table to track student consent for keystroke data recording.

-- Create keystroke_consent table to store consent information
CREATE TABLE IF NOT EXISTS keystroke_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_consented BOOLEAN NOT NULL DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_keystroke_consent_updated_at ON keystroke_consent;
CREATE TRIGGER update_keystroke_consent_updated_at 
    BEFORE UPDATE ON keystroke_consent 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_keystroke_consent_user_id ON keystroke_consent(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE keystroke_consent ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keystroke_consent table

-- Allow users to read their own consent status
CREATE POLICY "Users can read own consent" ON keystroke_consent
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own consent record
CREATE POLICY "Users can insert own consent" ON keystroke_consent
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own consent status
CREATE POLICY "Users can update own consent" ON keystroke_consent
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to read all consent records
CREATE POLICY "Admins can read all consent" ON keystroke_consent
    FOR SELECT USING (is_admin());

-- Allow admins to update consent records (for admin operations)
CREATE POLICY "Admins can update consent" ON keystroke_consent
    FOR UPDATE USING (is_admin());

-- Create function to get user's keystroke consent status
CREATE OR REPLACE FUNCTION get_keystroke_consent(target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_to_check UUID;
    consent_status BOOLEAN;
BEGIN
    -- Use provided user_id or current user's id
    user_id_to_check := COALESCE(target_user_id, auth.uid());
    
    -- If checking another user's consent, must be admin
    IF target_user_id IS NOT NULL AND target_user_id != auth.uid() AND NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT has_consented INTO consent_status
    FROM keystroke_consent 
    WHERE user_id = user_id_to_check;
    
    -- Return false if no record found (default to no consent)
    RETURN COALESCE(consent_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set user's keystroke consent
CREATE OR REPLACE FUNCTION set_keystroke_consent(consent_status BOOLEAN, target_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_to_update UUID;
BEGIN
    -- Use provided user_id or current user's id
    user_id_to_update := COALESCE(target_user_id, auth.uid());
    
    -- If updating another user's consent, must be admin
    IF target_user_id IS NOT NULL AND target_user_id != auth.uid() AND NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    INSERT INTO keystroke_consent (user_id, has_consented, consent_date)
    VALUES (user_id_to_update, consent_status, CASE WHEN consent_status THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        has_consented = consent_status,
        consent_date = CASE WHEN consent_status THEN NOW() ELSE keystroke_consent.consent_date END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE keystroke_consent IS 'Stores keystroke recording consent status for each user';
COMMENT ON FUNCTION get_keystroke_consent(UUID) IS 'Get keystroke consent status for a user';
COMMENT ON FUNCTION set_keystroke_consent(BOOLEAN, UUID) IS 'Set keystroke consent status for a user'; 