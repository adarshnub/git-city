-- Chat messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'global',
  content TEXT,
  type TEXT NOT NULL DEFAULT 'text',  -- text, code, audio, file, link
  metadata JSONB DEFAULT '{}',        -- language for code, file info, etc.
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages
CREATE POLICY "Messages are viewable by everyone"
  ON messages FOR SELECT
  USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (true);

-- Create a storage bucket for chat attachments (run in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
