-- =============================================
-- Multi-Subject Question Bank & Equal Distribution Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial 10 ECE Subjects
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

-- 2. Add Subject references to questions table
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_name TEXT;

-- 3. Add Equal Distribution Config to rounds table
ALTER TABLE public.rounds 
  ADD COLUMN IF NOT EXISTS equal_subject_distribution BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS questions_per_subject INT DEFAULT 5;

-- 4. Enable RLS and Grant Permissions
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on subjects" ON public.subjects;
CREATE POLICY "Allow all on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.subjects TO anon, authenticated, service_role;
