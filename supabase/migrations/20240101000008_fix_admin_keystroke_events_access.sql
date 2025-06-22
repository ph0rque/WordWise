-- ================================================
-- FIX ADMIN ACCESS TO KEYSTROKE EVENTS
-- ================================================
-- This migration adds a policy to allow admins to view keystroke events
-- for all users, not just their own recordings

-- Add admin policy for keystroke events
CREATE POLICY "Admins can view all keystroke events" ON keystroke_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    ); 