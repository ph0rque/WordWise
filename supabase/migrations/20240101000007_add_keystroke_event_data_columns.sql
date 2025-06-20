-- ================================================
-- ADD KEYSTROKE EVENT DATA COLUMNS
-- ================================================
-- This migration adds columns to store plain text keystroke data
-- since we've removed encryption for simplicity

-- Add columns for plain text keystroke data
ALTER TABLE keystroke_events 
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS data TEXT,
ADD COLUMN IF NOT EXISTS ctrlKey BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shiftKey BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS altKey BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metaKey BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_keystroke_events_key ON keystroke_events(key);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_modifiers ON keystroke_events(ctrlKey, shiftKey, altKey, metaKey);

-- Update the event_type constraint to include more types
ALTER TABLE keystroke_events 
DROP CONSTRAINT IF EXISTS keystroke_events_event_type_check;

ALTER TABLE keystroke_events 
ADD CONSTRAINT keystroke_events_event_type_check 
CHECK (event_type IN ('keydown', 'keyup', 'input', 'paste', 'cut', 'selection', 'delete', 'backspace')); 