-- ================================================
-- KEYSTROKE RECORDING SYSTEM MIGRATION
-- ================================================
-- This migration creates the complete keystroke recording system
-- with comprehensive privacy controls and educational analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- CONSENT MANAGEMENT TABLE
-- ================================================
-- Stores user consent for keystroke recording
CREATE TABLE IF NOT EXISTS keystroke_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    privacy_level TEXT NOT NULL CHECK (privacy_level IN ('full', 'anonymized', 'metadata_only')),
    data_retention_days INTEGER NOT NULL DEFAULT 90 CHECK (data_retention_days BETWEEN 7 AND 365),
    allow_teacher_review BOOLEAN NOT NULL DEFAULT false,
    allow_playback_review BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one consent record per user
    UNIQUE(user_id)
);

-- ================================================
-- MAIN RECORDING TABLE
-- ================================================
-- Stores metadata for each keystroke recording session
CREATE TABLE IF NOT EXISTS keystroke_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL, -- Reference to documents table
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    privacy_level TEXT NOT NULL DEFAULT 'full' CHECK (privacy_level IN ('full', 'anonymized', 'metadata_only')),
    
    -- Timing information
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms BIGINT,
    
    -- Session statistics
    total_keystrokes INTEGER DEFAULT 0,
    total_characters INTEGER DEFAULT 0,
    average_wpm DECIMAL(5,2),
    pause_count INTEGER DEFAULT 0,
    backspace_count INTEGER DEFAULT 0,
    delete_count INTEGER DEFAULT 0,
    
    -- Metadata
    user_agent TEXT,
    platform TEXT,
    language TEXT,
    timezone TEXT,
    document_title TEXT,
    
    -- Privacy and retention
    consent_given BOOLEAN NOT NULL DEFAULT false,
    data_retention_days INTEGER NOT NULL DEFAULT 90,
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique session per document
    UNIQUE(user_id, document_id, session_id)
);

-- ================================================
-- KEYSTROKE EVENTS TABLE
-- ================================================
-- Stores individual keystroke events with encryption
CREATE TABLE IF NOT EXISTS keystroke_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES keystroke_recordings(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- Client-generated unique ID
    sequence_number INTEGER NOT NULL,
    timestamp_ms BIGINT NOT NULL, -- Relative to recording start
    absolute_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Event data
    event_type TEXT NOT NULL CHECK (event_type IN ('keydown', 'keyup', 'input', 'paste', 'cut', 'selection')),
    encrypted_data BYTEA, -- Encrypted keystroke data
    data_hash TEXT, -- Hash for integrity verification
    
    -- Context information
    target_element TEXT, -- Element type (textarea, input, etc.)
    has_modifier_keys BOOLEAN DEFAULT false,
    is_functional_key BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique events per recording
    UNIQUE(recording_id, event_id),
    -- Ensure sequence order
    UNIQUE(recording_id, sequence_number)
);

-- ================================================
-- ANALYTICS TABLE
-- ================================================
-- Stores computed analytics for educational insights
CREATE TABLE IF NOT EXISTS keystroke_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES keystroke_recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Writing pattern metrics
    typing_speed_wpm DECIMAL(5,2),
    consistency_score DECIMAL(3,2), -- 0-1 scale
    pause_patterns JSONB, -- Detailed pause analysis
    revision_patterns JSONB, -- Backspace/delete patterns
    
    -- Productivity metrics
    focused_writing_time INTEGER, -- Time spent actively writing
    revision_time INTEGER, -- Time spent editing
    total_active_time INTEGER,
    
    -- Educational insights
    writing_flow_score DECIMAL(3,2), -- 0-1 scale
    planning_indicators JSONB, -- Evidence of planning vs. discovery writing
    confidence_indicators JSONB, -- Hesitation patterns
    
    -- Comparison data (anonymized)
    peer_comparison JSONB, -- How this compares to peer group
    improvement_suggestions JSONB, -- AI-generated suggestions
    
    -- Timestamps
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One analytics record per recording
    UNIQUE(recording_id)
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Consent table indexes
CREATE INDEX IF NOT EXISTS idx_keystroke_consent_user_id ON keystroke_consent(user_id);

-- Recording table indexes
CREATE INDEX IF NOT EXISTS idx_keystroke_recordings_user_id ON keystroke_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_recordings_document_id ON keystroke_recordings(document_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_recordings_status ON keystroke_recordings(status);
CREATE INDEX IF NOT EXISTS idx_keystroke_recordings_created_at ON keystroke_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keystroke_recordings_expires_at ON keystroke_recordings(expires_at) WHERE expires_at IS NOT NULL;

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_keystroke_events_recording_id ON keystroke_events(recording_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_sequence ON keystroke_events(recording_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_timestamp ON keystroke_events(recording_id, timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_type ON keystroke_events(event_type);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_keystroke_analytics_user_id ON keystroke_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_analytics_recording_id ON keystroke_analytics(recording_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE keystroke_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE keystroke_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE keystroke_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE keystroke_analytics ENABLE ROW LEVEL SECURITY;

-- Consent policies
CREATE POLICY "Users can view their own consent" ON keystroke_consent
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consent" ON keystroke_consent
    FOR ALL USING (auth.uid() = user_id);

-- Recording policies
CREATE POLICY "Users can view their own recordings" ON keystroke_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recordings" ON keystroke_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" ON keystroke_recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings" ON keystroke_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all recordings (for teacher dashboard)
CREATE POLICY "Admins can view all recordings" ON keystroke_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Events policies
CREATE POLICY "Users can view events for their recordings" ON keystroke_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM keystroke_recordings 
            WHERE id = keystroke_events.recording_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events for their recordings" ON keystroke_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM keystroke_recordings 
            WHERE id = keystroke_events.recording_id AND user_id = auth.uid()
        )
    );

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON keystroke_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create analytics" ON keystroke_analytics
    FOR INSERT WITH CHECK (true); -- Analytics are computed by system

CREATE POLICY "Admins can view all analytics" ON keystroke_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to create a new keystroke recording
CREATE OR REPLACE FUNCTION create_keystroke_recording(
    p_user_id UUID,
    p_document_id TEXT,
    p_session_id TEXT,
    p_title TEXT,
    p_privacy_level TEXT DEFAULT 'full',
    p_data_retention_days INTEGER DEFAULT 90
) RETURNS UUID AS $$
DECLARE
    v_recording_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration date
    v_expires_at := NOW() + (p_data_retention_days || ' days')::INTERVAL;
    
    -- Insert new recording
    INSERT INTO keystroke_recordings (
        user_id,
        document_id,
        session_id,
        title,
        privacy_level,
        data_retention_days,
        expires_at,
        consent_given
    ) VALUES (
        p_user_id,
        p_document_id,
        p_session_id,
        p_title,
        p_privacy_level,
        p_data_retention_days,
        v_expires_at,
        true -- Assume consent given if creating recording
    ) RETURNING id INTO v_recording_id;
    
    RETURN v_recording_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add keystroke event
CREATE OR REPLACE FUNCTION add_keystroke_event(
    p_recording_id UUID,
    p_event_id TEXT,
    p_sequence_number INTEGER,
    p_timestamp_ms BIGINT,
    p_event_type TEXT,
    p_encrypted_data BYTEA,
    p_data_hash TEXT DEFAULT NULL,
    p_target_element TEXT DEFAULT NULL,
    p_has_modifier_keys BOOLEAN DEFAULT false,
    p_is_functional_key BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Insert new event
    INSERT INTO keystroke_events (
        recording_id,
        event_id,
        sequence_number,
        timestamp_ms,
        event_type,
        encrypted_data,
        data_hash,
        target_element,
        has_modifier_keys,
        is_functional_key
    ) VALUES (
        p_recording_id,
        p_event_id,
        p_sequence_number,
        p_timestamp_ms,
        p_event_type,
        p_encrypted_data,
        p_data_hash,
        p_target_element,
        p_has_modifier_keys,
        p_is_functional_key
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a recording
CREATE OR REPLACE FUNCTION complete_keystroke_recording(
    p_recording_id UUID,
    p_end_time TIMESTAMPTZ DEFAULT NOW(),
    p_total_keystrokes INTEGER DEFAULT 0,
    p_total_characters INTEGER DEFAULT 0,
    p_average_wpm DECIMAL DEFAULT NULL,
    p_pause_count INTEGER DEFAULT 0,
    p_backspace_count INTEGER DEFAULT 0,
    p_delete_count INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_duration_ms BIGINT;
BEGIN
    -- Get start time and calculate duration
    SELECT start_time INTO v_start_time
    FROM keystroke_recordings
    WHERE id = p_recording_id;
    
    IF v_start_time IS NULL THEN
        RETURN false;
    END IF;
    
    v_duration_ms := EXTRACT(EPOCH FROM (p_end_time - v_start_time)) * 1000;
    
    -- Update recording with completion data
    UPDATE keystroke_recordings SET
        status = 'completed',
        end_time = p_end_time,
        duration_ms = v_duration_ms,
        total_keystrokes = p_total_keystrokes,
        total_characters = p_total_characters,
        average_wpm = p_average_wpm,
        pause_count = p_pause_count,
        backspace_count = p_backspace_count,
        delete_count = p_delete_count,
        updated_at = NOW()
    WHERE id = p_recording_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired recordings
CREATE OR REPLACE FUNCTION cleanup_expired_recordings() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired recordings
    DELETE FROM keystroke_recordings
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old recordings
CREATE OR REPLACE FUNCTION archive_old_recordings(p_days_old INTEGER DEFAULT 30) RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    -- Archive recordings older than specified days
    UPDATE keystroke_recordings SET
        status = 'archived',
        updated_at = NOW()
    WHERE status = 'completed'
        AND created_at < (NOW() - (p_days_old || ' days')::INTERVAL);
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TRIGGERS
-- ================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_keystroke_consent_updated_at
    BEFORE UPDATE ON keystroke_consent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keystroke_recordings_updated_at
    BEFORE UPDATE ON keystroke_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keystroke_analytics_updated_at
    BEFORE UPDATE ON keystroke_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- INITIAL DATA AND PERMISSIONS
-- ================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON keystroke_consent TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON keystroke_recordings TO authenticated;
GRANT SELECT, INSERT ON keystroke_events TO authenticated;
GRANT SELECT ON keystroke_analytics TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION create_keystroke_recording TO authenticated;
GRANT EXECUTE ON FUNCTION add_keystroke_event TO authenticated;
GRANT EXECUTE ON FUNCTION complete_keystroke_recording TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION cleanup_expired_recordings TO service_role;
GRANT EXECUTE ON FUNCTION archive_old_recordings TO service_role;

-- ================================================
-- COMPLETION MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE 'Keystroke Recording System Migration Completed Successfully!';
    RAISE NOTICE 'Tables created: keystroke_consent, keystroke_recordings, keystroke_events, keystroke_analytics';
    RAISE NOTICE 'Security: Row Level Security enabled with appropriate policies';
    RAISE NOTICE 'Features: Privacy controls, data retention, educational analytics';
END $$; 