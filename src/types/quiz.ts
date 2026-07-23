// Quiz-specific types

import { QuestionType, AttemptStatus } from './database';

export interface QuestionWithoutAnswer {
  id: string;
  round_id: string;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;
  marks: number;
  negative_marks: number;
  category: string | null;
  difficulty: string;
  order_index: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, QuizAnswer>;
  markedForReview: Set<string>;
  startedAt: string;
  timeRemaining: number;
  status: AttemptStatus;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: AnswerValue | null;
  answeredAt: string;
}

export type AnswerValue =
  | { type: 'mcq'; value: number }
  | { type: 'true_false'; value: boolean }
  | { type: 'fill_blank'; value: string }
  | { type: 'numerical'; value: number };

export interface QuizConfig {
  roundId: string;
  attemptId: string;
  duration: number;
  totalQuestions: number;
  negativeMarking: boolean;
  negativeMarksPerWrong: number;
}

export interface QuestionPaletteItem {
  index: number;
  questionId: string;
  status: 'current' | 'answered' | 'unanswered' | 'marked';
}

export interface TimerState {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export interface CSVQuestionRow {
  question_type: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: string;
  negative_marks: string;
  category: string;
  difficulty: string;
  explanation: string;
}

export interface RoundWithStats extends Record<string, unknown> {
  id: string;
  round_number: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  total_questions: number;
  total_attempts: number;
  submitted_attempts: number;
  disqualified_attempts: number;
}

export interface ParticipantRound {
  id: string;
  round_number: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  is_eligible: boolean;
  has_attempted: boolean;
  attempt_status: AttemptStatus | null;
}

export interface CertificateData {
  participantName: string;
  registerNumber: string;
  department: string;
  year: string;
  roundTitle: string;
  score: number;
  totalMarks: number;
  rank: number;
  date: string;
}
