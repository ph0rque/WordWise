-- Migration: Add keystroke recording consent to auth.users table
-- This migration adds a boolean column to track student consent for keystroke data recording.

-- Add has_consented_to_keystrokes column to auth.users table
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS has_consented_to_keystrokes BOOLEAN DEFAULT FALSE;

-- Create a policy to allow users to update their own consent status
-- This is important for the onboarding flow where the user is logged in
-- and needs to update this specific field.
CREATE POLICY "Users can update their own keystroke consent" ON auth.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Comment for documentation
COMMENT ON COLUMN auth.users.has_consented_to_keystrokes IS 'Indicates if the student has consented to keystroke data recording for educational analysis.'; 