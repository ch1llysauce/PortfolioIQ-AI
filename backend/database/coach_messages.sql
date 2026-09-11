-- ==============================================================================
-- PortfolioIQ-AI: AI Developer Coach Messages Table (Supabase Cloud Persistence)
-- ==============================================================================

-- 1. Create coach_messages table
CREATE TABLE IF NOT EXISTS public.coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can view their own conversation messages
CREATE POLICY "Users can view own coach messages"
    ON public.coach_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Policy: Users can insert their own messages
CREATE POLICY "Users can insert own coach messages"
    ON public.coach_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Users can delete their own conversation history
CREATE POLICY "Users can delete own coach messages"
    ON public.coach_messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_created 
    ON public.coach_messages (user_id, created_at ASC);

