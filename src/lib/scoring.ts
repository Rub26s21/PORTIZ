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
  } else {
    marksAwarded = 0; // Negative marks entirely removed
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

function normalizeText(text: string): string {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function cleanAlphanumeric(text: string): string {
  return normalizeText(text)
    .replace(/\b(an|a|the)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function scoreFillBlank(correct: any, selected: any): boolean {
  let cVal = typeof correct === 'object' && correct !== null ? (correct.value !== undefined ? correct.value : correct) : correct;
  let sVal = typeof selected === 'object' && selected !== null ? (selected.value !== undefined ? selected.value : selected) : selected;

  if (sVal === undefined || sVal === null || String(sVal).trim() === '') return false;

  const rawUser = String(sVal).trim();
  const userClean = cleanAlphanumeric(rawUser);

  let acceptableList: string[] = [];
  if (Array.isArray(cVal)) {
    acceptableList = cVal.map((v) => String(v).trim());
  } else if (typeof cVal === 'string') {
    if (cVal.startsWith('[') && cVal.endsWith(']')) {
      try {
        const parsed = JSON.parse(cVal);
        if (Array.isArray(parsed)) acceptableList = parsed.map((v) => String(v).trim());
      } catch {
        acceptableList = [cVal];
      }
    } else {
      acceptableList = cVal.split(/[,|;/]/).map((v) => v.trim()).filter(Boolean);
      if (!acceptableList.includes(cVal) && cVal.length > 0) acceptableList.unshift(cVal);
    }
  } else {
    acceptableList = [String(cVal ?? '').trim()];
  }

  // 1. Direct and normalized check
  for (const acc of acceptableList) {
    if (!acc) continue;
    if (normalizeText(acc) === normalizeText(rawUser)) return true;
    const accClean = cleanAlphanumeric(acc);
    if (accClean && userClean === accClean) return true;

    // Unit aliases (e.g., ohm / ohms / Ω)
    if (accClean === 'ohm' || accClean === 'ohms') {
      if (['ohm', 'ohms', 'o'].includes(userClean) || rawUser === 'Ω') return true;
    }
    if (accClean === 'farad' || accClean === 'farads') {
      if (['farad', 'farads', 'f'].includes(userClean)) return true;
    }
    if (accClean === 'henry' || accClean === 'henries') {
      if (['henry', 'henries', 'h'].includes(userClean)) return true;
    }
    if (accClean === 'hertz' || accClean === 'hz') {
      if (['hertz', 'hz'].includes(userClean)) return true;
    }

    // Binary formatting (e.g. 101 vs 0101 vs 5)
    if (accClean === '101') {
      const stripped = userClean.replace(/^0+/, '');
      if (stripped === '101' || userClean === '101' || userClean === '0101' || userClean === '5') {
        return true;
      }
    }

    // Logic gate name check e.g. 'and' vs 'and gate'
    const logicGates = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'];
    for (const gate of logicGates) {
      if (accClean === gate || accClean === `${gate}gate`) {
        if (userClean === gate || userClean === `${gate}gate`) return true;
      }
    }

    // Common Electronics Abbreviations
    const abbrevMap: Record<string, string[]> = {
      pcb: ['printedcircuitboard', 'pcb'],
      ic: ['integratedcircuit', 'ic'],
      bjt: ['bipolarjunctiontransistor', 'bjt'],
      fet: ['fieldeffecttransistor', 'fet'],
      opamp: ['operationalamplifier', 'opamp', 'opampcircuit'],
      led: ['lightemittingdiode', 'led'],
    };
    for (const [key, variants] of Object.entries(abbrevMap)) {
      if (variants.includes(accClean) && variants.includes(userClean)) {
        return true;
      }
    }
  }

  return false;
}

function scoreNumerical(correct: any, selected: any): boolean {
  let cVal = typeof correct === 'object' && correct !== null ? (correct.value !== undefined ? correct.value : correct) : correct;
  let sVal = typeof selected === 'object' && selected !== null ? (selected.value !== undefined ? selected.value : selected) : selected;
  const tol = typeof correct === 'object' && correct !== null ? (correct.tolerance || 0) : 0;
  return Math.abs(Number(sVal) - Number(cVal)) <= tol;
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
