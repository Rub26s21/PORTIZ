// Server-side scoring logic — correct answers NEVER sent to browser

import { CorrectAnswer, SelectedAnswer, Question } from '@/types/database';

interface ScoringResult {
  isCorrect: boolean;
  marksAwarded: number;
}

export function scoreAnswer(
  question: Question,
  selectedAnswer: SelectedAnswer | null,
  negativeMarking: boolean,
  negativeMarksPerWrong: number
): ScoringResult {
  if (!selectedAnswer) {
    return { isCorrect: false, marksAwarded: 0 };
  }

  const correctAnswer = question.correct_answer as CorrectAnswer;
  let isCorrect = false;

  switch (question.question_type) {
    case 'mcq':
      isCorrect = scoreMCQ(correctAnswer, selectedAnswer);
      break;
    case 'true_false':
      isCorrect = scoreTrueFalse(correctAnswer, selectedAnswer);
      break;
    case 'fill_blank':
      isCorrect = scoreFillBlank(correctAnswer, selectedAnswer);
      break;
    case 'numerical':
      isCorrect = scoreNumerical(correctAnswer, selectedAnswer);
      break;
    default:
      isCorrect = false;
  }

  let marksAwarded: number;
  if (isCorrect) {
    marksAwarded = question.marks;
  } else if (negativeMarking && selectedAnswer) {
    marksAwarded = -(question.negative_marks || negativeMarksPerWrong);
  } else {
    marksAwarded = 0;
  }

  return { isCorrect, marksAwarded };
}

function scoreMCQ(correct: CorrectAnswer, selected: SelectedAnswer): boolean {
  if (correct.type !== 'mcq' || selected.type !== 'mcq') return false;
  return correct.value === selected.value;
}

function scoreTrueFalse(correct: CorrectAnswer, selected: SelectedAnswer): boolean {
  if (correct.type !== 'true_false' || selected.type !== 'true_false') return false;
  return correct.value === selected.value;
}

function scoreFillBlank(correct: CorrectAnswer, selected: SelectedAnswer): boolean {
  if (correct.type !== 'fill_blank' || selected.type !== 'fill_blank') return false;
  const normalizedSelected = normalizeText(selected.value);
  return correct.value.some((accepted) => normalizeText(accepted) === normalizedSelected);
}

function scoreNumerical(correct: CorrectAnswer, selected: SelectedAnswer): boolean {
  if (correct.type !== 'numerical' || selected.type !== 'numerical') return false;
  return Math.abs(selected.value - correct.value) <= correct.tolerance;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Calculate total score for an attempt
export interface AttemptScoreResult {
  totalScore: number;
  totalMarks: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
  }>;
}

export function calculateAttemptScore(
  questions: Question[],
  responses: Array<{ question_id: string; selected_answer: SelectedAnswer | null }>,
  negativeMarking: boolean,
  negativeMarksPerWrong: number
): AttemptScoreResult {
  let totalScore = 0;
  let totalMarks = 0;
  const results: AttemptScoreResult['results'] = [];

  for (const question of questions) {
    totalMarks += question.marks;
    const response = responses.find((r) => r.question_id === question.id);
    const selectedAnswer = response?.selected_answer ?? null;

    const { isCorrect, marksAwarded } = scoreAnswer(
      question,
      selectedAnswer,
      negativeMarking,
      negativeMarksPerWrong
    );

    totalScore += marksAwarded;
    results.push({
      questionId: question.id,
      isCorrect,
      marksAwarded,
    });
  }

  return { totalScore: Math.max(0, totalScore), totalMarks, results };
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate randomized question order
export function generateQuestionOrder(questionIds: string[]): string[] {
  return shuffleArray(questionIds);
}

// Generate randomized option order for MCQs
export function generateOptionOrder(
  questions: Question[]
): Record<string, number[]> {
  const optionOrder: Record<string, number[]> = {};

  for (const question of questions) {
    if (question.question_type === 'mcq' && question.options) {
      const indices = question.options.map((_, i) => i);
      optionOrder[question.id] = shuffleArray(indices);
    }
  }

  return optionOrder;
}
