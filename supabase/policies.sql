-- =============================================
-- Row Level Security Policies
-- Run AFTER schema.sql
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_eligibility ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: admins can read all
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles: users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: service role can insert (for registration)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Profiles: admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions: NEVER expose correct_answer to participants
-- All question fetching for participants goes through API routes with service role
CREATE POLICY "Only admins can access questions directly" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Questions: admins can manage
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Rounds: everyone can read published/live/closed
CREATE POLICY "Anyone can read active rounds" ON rounds
  FOR SELECT USING (status IN ('published', 'live', 'closed'));

-- Rounds: admins can read all rounds
CREATE POLICY "Admins can read all rounds" ON rounds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Rounds: admins can manage
CREATE POLICY "Admins can manage rounds" ON rounds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Attempts: users see own attempts
CREATE POLICY "Users see own attempts" ON attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Attempts: admins see all
CREATE POLICY "Admins see all attempts" ON attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Attempts: service role manages (for API routes)
CREATE POLICY "Service can manage attempts" ON attempts
  FOR ALL USING (true);

-- Responses: users see own
CREATE POLICY "Users see own responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM attempts WHERE attempts.id = responses.attempt_id AND attempts.user_id = auth.uid())
  );

-- Responses: service role manages
CREATE POLICY "Service can manage responses" ON responses
  FOR ALL USING (true);

-- Proctor events: admins can read
CREATE POLICY "Admins see proctor events" ON proctor_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Proctor events: service role can insert
CREATE POLICY "Service can manage proctor events" ON proctor_events
  FOR ALL USING (true);

-- Round eligibility: users can check own
CREATE POLICY "Users check own eligibility" ON round_eligibility
  FOR SELECT USING (auth.uid() = user_id);

-- Round eligibility: admins manage
CREATE POLICY "Admins manage eligibility" ON round_eligibility
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
