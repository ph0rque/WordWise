-- Add admin policy for keystroke events (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'keystroke_events' 
        AND policyname = 'Admins can view all keystroke events'
    ) THEN
        CREATE POLICY "Admins can view all keystroke events" ON keystroke_events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_roles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$; 