-- =============================================
-- Electronic Club Quiz Portal — Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  register_number TEXT UNIQUE,
  display_name TEXT NOT NULL,
  department TEXT,
  year TEXT,
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Rounds
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,            -- optional scheduled start (nullable for manual start)
  end_time TIMESTAMPTZ,              -- optional scheduled end (nullable for manual start)
  started_at TIMESTAMPTZ,            -- actual start timestamp (set when admin clicks Start)
  ended_at TIMESTAMPTZ,              -- actual end timestamp (set when admin clicks Close)
  duration_minutes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  requires_promotion BOOLEAN DEFAULT FALSE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  randomize_options BOOLEAN DEFAULT TRUE,
  negative_marking BOOLEAN DEFAULT FALSE,
  negative_marks_per_wrong NUMERIC DEFAULT 0,
  show_results BOOLEAN DEFAULT FALSE,
  show_leaderboard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Round Eligibility (admin promotes users to specific rounds)
CREATE TABLE IF NOT EXISTS round_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL, -- 'mcq' | 'true_false' | 'fill_blank' | 'numerical'
  question_text TEXT NOT NULL,
  options JSONB, -- for mcq: ["A","B","C","D"]
  correct_answer JSONB NOT NULL, -- stored server-side only, NEVER sent to client
  marks NUMERIC DEFAULT 1,
  negative_marks NUMERIC DEFAULT 0,
  image_url TEXT,
  image_alt TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'medium',
  explanation TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attempts (one per user per round)
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'in_progress', -- in_progress | submitted | disqualified
  disqualification_reason TEXT,
  question_order JSONB, -- randomized order for this user
  option_order JSONB,   -- randomized option order per question
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, round_id)
);

-- Responses
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer JSONB,
  is_correct BOOLEAN,
  marks_awarded NUMERIC DEFAULT 0,
  answered_at TIMESTAMPTZ,
  UNIQUE(attempt_id, question_id)
);

-- Proctoring Events
CREATE TABLE IF NOT EXISTS proctor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) Policies
-- Run this block in Supabase SQL Editor
-- =============================================

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_events ENABLE ROW LEVEL SECURITY;

-- Rounds Policies
DROP POLICY IF EXISTS "Allow all on rounds" ON public.rounds;
CREATE POLICY "Allow all on rounds" ON public.rounds FOR ALL USING (true) WITH CHECK (true);

-- Questions Policies
DROP POLICY IF EXISTS "Allow all on questions" ON public.questions;
CREATE POLICY "Allow all on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

-- Attempts Policies
DROP POLICY IF EXISTS "Allow all on attempts" ON public.attempts;
CREATE POLICY "Allow all on attempts" ON public.attempts FOR ALL USING (true) WITH CHECK (true);

-- Responses Policies
DROP POLICY IF EXISTS "Allow all on responses" ON public.responses;
CREATE POLICY "Allow all on responses" ON public.responses FOR ALL USING (true) WITH CHECK (true);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Round Eligibility Policies
DROP POLICY IF EXISTS "Allow all on round_eligibility" ON public.round_eligibility;
CREATE POLICY "Allow all on round_eligibility" ON public.round_eligibility FOR ALL USING (true) WITH CHECK (true);

-- Proctor Events Policies
DROP POLICY IF EXISTS "Allow all on proctor_events" ON public.proctor_events;
CREATE POLICY "Allow all on proctor_events" ON public.proctor_events FOR ALL USING (true) WITH CHECK (true);

