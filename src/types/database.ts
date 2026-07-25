// Database type definitions for Supabase tables

export interface Profile {
  id: string;
  email: string;
  register_number: string | null;
  display_name: string;
  department: string | null;
  year: string | null;
  role: 'admin' | 'participant';
  created_at: string;
}

export interface Round {
  id: string;
  round_number: number;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number;
  status: RoundStatus;
  requires_promotion: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  show_results: boolean;
  show_leaderboard: boolean;
  created_at: string;
}

export type RoundStatus = 'draft' | 'published' | 'live' | 'closed';

export interface Question {
  id: string;
  round_id: string;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: CorrectAnswer;
  marks: number;
  negative_marks: number;
  category: string | null;
  difficulty: QuestionDifficulty;
  explanation: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  order_index: number;
  created_at: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'numerical';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type CorrectAnswer =
  | { type: 'mcq'; value: number } // index of correct option
  | { type: 'true_false'; value: boolean }
  | { type: 'fill_blank'; value: string[] } // accepted answers
  | { type: 'numerical'; value: number; tolerance: number };

export interface Attempt {
  id: string;
  user_id: string;
  round_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number;
  total_marks: number;
  status: AttemptStatus;
  disqualification_reason: string | null;
  question_order: string[] | null;
  option_order: Record<string, number[]> | null;
  created_at: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'disqualified';

export interface Response {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: SelectedAnswer | null;
  is_correct: boolean | null;
  marks_awarded: number;
  answered_at: string | null;
}

export type SelectedAnswer =
  | { type: 'mcq'; value: number }
  | { type: 'true_false'; value: boolean }
  | { type: 'fill_blank'; value: string }
  | { type: 'numerical'; value: number };

export interface ProctorEvent {
  id: string;
  attempt_id: string;
  event_type: ProctorEventType;
  occurred_at: string;
}

export type ProctorEventType =
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'fullscreen_denied'
  | 'devtools_detected'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'keyboard_shortcut';

export interface RoundEligibility {
  id: string;
  round_id: string;
  user_id: string;
  promoted_at: string;
}

// Join types for API responses
export interface AttemptWithProfile extends Attempt {
  profiles: Profile;
}

export interface AttemptWithRound extends Attempt {
  rounds: Round;
}

export interface ResponseWithQuestion extends Response {
  questions: Question;
}

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  register_number: string | null;
  score: number;
  total_marks: number;
  submitted_at: string | null;
}

// Database insert/update types
export interface RoundInsert {
  round_number: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status?: RoundStatus;
  requires_promotion?: boolean;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  negative_marking?: boolean;
  negative_marks_per_wrong?: number;
  show_results?: boolean;
  show_leaderboard?: boolean;
}

export interface QuestionInsert {
  round_id: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[] | null;
  correct_answer: CorrectAnswer;
  marks?: number;
  negative_marks?: number;
  category?: string;
  difficulty?: QuestionDifficulty;
  explanation?: string;
  order_index?: number;
}

export interface ProfileUpdate {
  display_name?: string;
  department?: string;
  year?: string;
  register_number?: string;
}
