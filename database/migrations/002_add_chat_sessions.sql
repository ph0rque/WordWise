-- Migration: Add chat sessions and messages for AI Essay Tutor
-- This migration adds tables to store AI tutor chat sessions and messages

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('user', 'assistant', 'system');

-- Create enum for message status
CREATE TYPE message_status AS ENUM ('sending', 'sent', 'delivered', 'error');

-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'AI Tutor Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure one active session per document per user
    UNIQUE(user_id, document_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status message_status DEFAULT 'delivered',
    
    -- AI-specific metadata
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    suggested_questions JSONB DEFAULT '[]'::jsonb,
    related_concepts JSONB DEFAULT '[]'::jsonb,
    
    -- User feedback
    feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful')),
    feedback_at TIMESTAMPTZ,
    
    -- Message ordering
    sequence_number INTEGER NOT NULL,
    
    -- Ensure sequential ordering within session
    UNIQUE(session_id, sequence_number)
);

-- Create indexes for efficient queries
CREATE INDEX idx_chat_sessions_user_document ON chat_sessions(user_id, document_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(is_active) WHERE is_active = true;

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, sequence_number);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update session's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_last_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_message();

-- Create function to auto-increment sequence numbers
CREATE OR REPLACE FUNCTION set_message_sequence_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sequence_number IS NULL THEN
        SELECT COALESCE(MAX(sequence_number), 0) + 1
        INTO NEW.sequence_number
        FROM chat_messages
        WHERE session_id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_sequence_number_trigger
    BEFORE INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_sequence_number();

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Sessions policies
CREATE POLICY "Students can read own chat sessions" ON chat_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "Students can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Students can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "Students can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (
        user_id = auth.uid() OR is_admin()
    );

-- Chat Messages policies
CREATE POLICY "Students can read own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE id = session_id 
            AND (user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "Students can create own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE id = session_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Students can update own chat messages" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE id = session_id 
            AND (user_id = auth.uid() OR is_admin())
        )
    );

-- Helper functions for chat management

-- Function to get or create active chat session for document
CREATE OR REPLACE FUNCTION get_or_create_chat_session(
    p_user_id UUID,
    p_document_id UUID,
    p_title TEXT DEFAULT 'AI Tutor Chat'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Try to find existing active session
    SELECT id INTO session_id
    FROM chat_sessions
    WHERE user_id = p_user_id 
    AND document_id = p_document_id 
    AND is_active = true
    LIMIT 1;
    
    -- Create new session if none exists
    IF session_id IS NULL THEN
        INSERT INTO chat_sessions (user_id, document_id, title)
        VALUES (p_user_id, p_document_id, p_title)
        RETURNING id INTO session_id;
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add message to chat session
CREATE OR REPLACE FUNCTION add_chat_message(
    p_session_id UUID,
    p_message_type message_type,
    p_content TEXT,
    p_confidence INTEGER DEFAULT NULL,
    p_suggested_questions JSONB DEFAULT '[]'::jsonb,
    p_related_concepts JSONB DEFAULT '[]'::jsonb,
    p_status message_status DEFAULT 'delivered'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO chat_messages (
        session_id,
        message_type,
        content,
        confidence,
        suggested_questions,
        related_concepts,
        status
    )
    VALUES (
        p_session_id,
        p_message_type,
        p_content,
        p_confidence,
        p_suggested_questions,
        p_related_concepts,
        p_status
    )
    RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old chat sessions (keep only last 10 per user per document)
CREATE OR REPLACE FUNCTION cleanup_old_chat_sessions()
RETURNS INTEGER AS $$
DECLARE
    sessions_archived INTEGER := 0;
BEGIN
    -- Archive old sessions, keeping only the 10 most recent per user per document
    WITH ranked_sessions AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, document_id 
                   ORDER BY last_message_at DESC
               ) as rn
        FROM chat_sessions
        WHERE is_active = true
    )
    UPDATE chat_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE id IN (
        SELECT id FROM ranked_sessions WHERE rn > 10
    );
    
    GET DIAGNOSTICS sessions_archived = ROW_COUNT;
    RETURN sessions_archived;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE chat_sessions IS 'AI tutor chat sessions linked to documents and users';
COMMENT ON TABLE chat_messages IS 'Individual messages within AI tutor chat sessions';
COMMENT ON FUNCTION get_or_create_chat_session IS 'Get existing or create new chat session for a document';
COMMENT ON FUNCTION add_chat_message IS 'Add a new message to a chat session';
COMMENT ON FUNCTION cleanup_old_chat_sessions IS 'Archive old chat sessions to keep database clean'; 