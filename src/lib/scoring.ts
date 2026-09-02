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
      isCorrect = scoreMCQ(correctAnswer, selectedAnswer, question.options);
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

function scoreMCQ(correct: any, selected: any, questionOptions?: string[] | null): boolean {
  let cVal = typeof correct === 'object' ? (correct?.value !== undefined ? correct.value : correct) : correct;
  let sVal = typeof selected === 'object' ? (selected?.value !== undefined ? selected.value : selected) : selected;

  if (cVal === undefined || cVal === null || sVal === undefined || sVal === null) return false;

  const cStr = String(cVal).trim().toLowerCase();
  const sStr = String(sVal).trim().toLowerCase();

  if (cStr === sStr) return true;

  if (questionOptions && Array.isArray(questionOptions)) {
    const cIdx = Number(cVal);
    if (!isNaN(cIdx) && cIdx >= 0 && cIdx < questionOptions.length) {
      if (String(questionOptions[cIdx]).trim().toLowerCase() === sStr) return true;
    }

    const sIdx = Number(sVal);
    if (!isNaN(sIdx) && sIdx >= 0 && sIdx < questionOptions.length) {
      if (String(questionOptions[sIdx]).trim().toLowerCase() === cStr) return true;
    }
  }

  return false;
}

function scoreTrueFalse(correct: any, selected: any): boolean {
  let cVal = typeof correct === 'object' ? correct?.value : correct;
  let sVal = typeof selected === 'object' ? selected?.value : selected;
  return String(cVal).trim().toLowerCase() === String(sVal).trim().toLowerCase();
}

function scoreFillBlank(correct: any, selected: any): boolean {
  let cVal = typeof correct === 'object' ? correct?.value : correct;
  let sVal = typeof selected === 'object' ? selected?.value : selected;
  if (Array.isArray(cVal)) {
    return cVal.some((accepted) => normalizeText(String(accepted)) === normalizeText(String(sVal)));
  }
  return normalizeText(String(cVal)) === normalizeText(String(sVal));
}

function scoreNumerical(correct: any, selected: any): boolean {
  let cVal = typeof correct === 'object' ? correct?.value : correct;
  let sVal = typeof selected === 'object' ? selected?.value : selected;
  const tol = typeof correct === 'object' ? (correct?.tolerance || 0) : 0;
  return Math.abs(Number(sVal) - Number(cVal)) <= tol;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Calculate total score for an attempt
export interface SubjectMetric {
  subjectName: string;
  totalQuestions: number;
  correctQuestions: number;
  score: number;
  totalMarks: number;
  accuracyPercentage: number;
}

export interface AttemptScoreResult {
  totalScore: number;
  totalMarks: number;
  subjectBreakdown: Record<string, SubjectMetric>;
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
  const subjectMap: Record<string, SubjectMetric> = {};

  for (const question of questions) {
    totalMarks += question.marks;
    const response = responses.find((r) => r.question_id === question.id);
    const selectedAnswer = response?.selected_answer ?? null;

    const subName = (question as any).subject_name || question.category || 'General';
    if (!subjectMap[subName]) {
      subjectMap[subName] = {
        subjectName: subName,
        totalQuestions: 0,
        correctQuestions: 0,
        score: 0,
        totalMarks: 0,
        accuracyPercentage: 0,
      };
    }

    const subMetric = subjectMap[subName];
    subMetric.totalQuestions += 1;
    subMetric.totalMarks += question.marks;

    const { isCorrect, marksAwarded } = scoreAnswer(
      question,
      selectedAnswer,
      negativeMarking,
      negativeMarksPerWrong
    );

    if (isCorrect) {
      subMetric.correctQuestions += 1;
    }
    subMetric.score += marksAwarded;

    totalScore += marksAwarded;
    results.push({
      questionId: question.id,
      isCorrect,
      marksAwarded,
    });
  }

  // Calculate percentages
  Object.values(subjectMap).forEach((m) => {
    m.score = Math.max(0, Math.round(m.score * 100) / 100);
    m.accuracyPercentage = m.totalQuestions > 0 ? Math.round((m.correctQuestions / m.totalQuestions) * 100) : 0;
  });

  return {
    totalScore: Math.max(0, Math.round(totalScore * 100) / 100),
    totalMarks,
    subjectBreakdown: subjectMap,
    results,
  };
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
