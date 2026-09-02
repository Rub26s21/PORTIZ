-- ====================================================================
-- Electronic Club Quiz Portal — Complete Single-Paste Database Schema & Migrations
-- Copy and run this ENTIRE block in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ucfafsaegkzknkbkpvsq/sql
-- ====================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Participants Table (For quick participant login & registration)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  register_no TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles Table (Extends auth.users for admin & auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  register_number TEXT UNIQUE,
  display_name TEXT NOT NULL,
  department TEXT,
  year TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Subjects Table (10 Department Level Subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 10 ECE Subjects
INSERT INTO public.subjects (name, code) VALUES
  ('Digital Electronics', 'EC301'),
  ('Microprocessors & Microcontrollers', 'EC302'),
  ('VLSI Design', 'EC401'),
  ('Signals & Systems', 'EC303'),
  ('Analog Circuits', 'EC201'),
  ('Communication Systems', 'EC402'),
  ('Control Systems', 'EC304'),
  ('Electromagnetic Fields', 'EC202'),
  ('Embedded Systems', 'EC403'),
  ('Basic Electrical Engineering', 'EC101')
ON CONFLICT (name) DO NOTHING;

-- 5. Rounds Table (Test Papers & Automation Scheduling)
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 45,
  status TEXT NOT NULL DEFAULT 'draft',
  requires_promotion BOOLEAN DEFAULT FALSE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  randomize_options BOOLEAN DEFAULT TRUE,
  negative_marking BOOLEAN DEFAULT FALSE,
  negative_marks_per_wrong NUMERIC DEFAULT 0,
  show_results BOOLEAN DEFAULT TRUE,
  show_leaderboard BOOLEAN DEFAULT TRUE,
  equal_subject_distribution BOOLEAN DEFAULT TRUE,
  questions_per_subject INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Questions Table (Question Bank)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT,
  question_type TEXT NOT NULL DEFAULT 'mcq', -- 'mcq' | 'true_false' | 'fill_blank' | 'numerical'
  question_text TEXT NOT NULL,
  options JSONB, -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer JSONB NOT NULL, -- { type: "mcq", value: 0 } or text
  marks NUMERIC DEFAULT 2,
  negative_marks NUMERIC DEFAULT 0.5,
  image_url TEXT,
  image_alt TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'medium',
  explanation TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns safely if questions table already existed
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_name TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

ALTER TABLE public.rounds 
  ADD COLUMN IF NOT EXISTS equal_subject_distribution BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS questions_per_subject INT DEFAULT 5;

-- 7. Round Eligibility
CREATE TABLE IF NOT EXISTS public.round_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id)
);

-- 8. Attempts Table (Student Test Sessions)
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'submitted' | 'disqualified'
  disqualification_reason TEXT,
  question_order JSONB,
  option_order JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Responses Table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  selected TEXT, -- Saved answer string
  selected_answer JSONB,
  is_correct BOOLEAN,
  marks_awarded NUMERIC DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- 10. Proctor Events
CREATE TABLE IF NOT EXISTS public.proctor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable Row Level Security (RLS) & Set Permissive Access Policies
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on participants" ON public.participants;
CREATE POLICY "Allow all on participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on subjects" ON public.subjects;
CREATE POLICY "Allow all on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on rounds" ON public.rounds;
CREATE POLICY "Allow all on rounds" ON public.rounds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on questions" ON public.questions;
CREATE POLICY "Allow all on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on attempts" ON public.attempts;
CREATE POLICY "Allow all on attempts" ON public.attempts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on responses" ON public.responses;
CREATE POLICY "Allow all on responses" ON public.responses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on round_eligibility" ON public.round_eligibility;
CREATE POLICY "Allow all on round_eligibility" ON public.round_eligibility FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on proctor_events" ON public.proctor_events;
CREATE POLICY "Allow all on proctor_events" ON public.proctor_events FOR ALL USING (true) WITH CHECK (true);

-- Grant All Permissions to Anon, Authenticated, Service Role
GRANT ALL ON TABLE public.participants TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rounds TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.attempts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.responses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.round_eligibility TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.proctor_events TO anon, authenticated, service_role;

-- ====================================================================
-- SETUP COMPLETE: All tables, columns, seeds, and permissions ready!
-- ====================================================================
