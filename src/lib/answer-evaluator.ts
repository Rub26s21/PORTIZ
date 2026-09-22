/**
 * 3-Stage Smart Engineering Answer Evaluation Engine
 * Evaluates both Multiple Choice Questions (MCQ) and Fill-in-the-Blank (FITB) / Text / Numerical Questions.
 *
 * Stage 1: Canonical Normalization & Multi-Alias Equivalence
 * Stage 2: Engineering & SI Unit Numerical Equivalence (with SI prefixes: k, M, m, u/µ, n, p)
 * Stage 3: Guarded Typo-Tolerance (Levenshtein Distance with Acronym Shield for short technical terms)
 */

export interface EvaluationResult {
  isCorrect: boolean;
  matchType:
    | 'exact'
    | 'normalized'
    | 'unit_equivalent'
    | 'typo_tolerant'
    | 'mcq_index'
    | 'mcq_text'
    | 'none';
  userAnswerFormatted: string;
  correctAnswerFormatted: string;
  feedback: string;
}

// Technical acronyms that MUST match exactly and NEVER allow fuzzy/typo matching
const PROTECTED_ACRONYMS = new Set([
  'npn', 'pnp', 'fet', 'jfet', 'mosfet', 'bjt', 'scr', 'triac', 'diac',
  'led', 'lcd', 'oled', 'cmos', 'ttl', 'ecl', 'and', 'nand', 'or',
  'nor', 'xor', 'xnor', 'not', 'ram', 'rom', 'prom', 'eprom', 'eeprom',
  'adc', 'dac', 'opamp', 'pwm', 'pll', 'vco', 'dsp', 'cpu', 'alu',
  'risc', 'cisc', 'uart', 'usart', 'spi', 'i2c', 'can', 'usb', 'lan',
  'rf', 'if', 'am', 'fm', 'pm', 'ask', 'fsk', 'psk', 'qam', 'qpsk',
  'pcm', 'dm', 'adm', 'tdm', 'fdm', 'cdma', 'gsm', 'vcc', 'vee', 'gnd'
]);

// Stop words / filler articles stripped during canonical normalization
const FILLER_WORDS_REGEX = /\b(the|a|an|gate|circuit|value|is|type|signal|junction|region)\b/gi;

// SI Unit multipliers
const SI_PREFIXES: Record<string, number> = {
  g: 1e9,
  m_mega: 1e6,
  k: 1e3,
  m_milli: 1e-3,
  u: 1e-6,
  µ: 1e-6,
  n: 1e-9,
  p: 1e-12,
};

/**
 * Clean and canonically normalize a text string
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(FILLER_WORDS_REGEX, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split possible multi-alias correct answers
 * Supports: "AND | AND gate", "AND, AND gate", or JSON array strings
 */
export function parseCorrectAnswers(correctAnswerRaw: any): string[] {
  if (correctAnswerRaw === null || correctAnswerRaw === undefined) return [];

  let val = correctAnswerRaw;
  if (typeof val === 'object' && val.value !== undefined) {
    val = val.value;
  }

  if (Array.isArray(val)) {
    return val.map((v) => String(v).trim()).filter(Boolean);
  }

  const str = String(val).trim();
  if (!str) return [];

  // If JSON array
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {}
  }

  // If pipe separated: "AND | AND gate"
  if (str.includes('|')) {
    return str.split('|').map((s) => s.trim()).filter(Boolean);
  }

  return [str];
}

/**
 * Attempt to parse a numeric value with optional SI unit
 * e.g. "10 kHz" -> { value: 10000, unit: "hz" }
 * e.g. "5V" -> { value: 5, unit: "v" }
 * e.g. "0.5" -> { value: 0.5, unit: "" }
 */
export function parseEngineeringValue(input: string): { num: number; unit: string } | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, '');

  // Matches number with optional scientific notation and optional SI prefix + unit
  // e.g. 10k, 10khz, 4.7k, 500mv, 0.5, -3.3v
  const match = cleaned.match(/^([+-]?\d*(?:\.\d+)?(?:e[+-]?\d+)?)([a-zµΩ]*)$/i);
  if (!match) return null;

  const numStr = match[1];
  const unitStr = match[2];

  if (!numStr || isNaN(Number(numStr))) return null;

  let baseNum = Number(numStr);
  let multiplier = 1;
  let normalizedUnit = unitStr;

  if (unitStr.length > 0) {
    const firstChar = unitStr[0];
    const isMega = unitStr.startsWith('m') && (unitStr.includes('hz') || unitStr === 'm' || unitStr.startsWith('meg'));

    if (firstChar === 'g') {
      multiplier = SI_PREFIXES.g;
      normalizedUnit = unitStr.slice(1);
    } else if (isMega && (unitStr.startsWith('meg') || unitStr.length <= 2 || unitStr === 'mhz')) {
      multiplier = SI_PREFIXES.m_mega;
      normalizedUnit = unitStr.replace(/^meg(a)?/, '').replace(/^m/, '');
    } else if (firstChar === 'k') {
      multiplier = SI_PREFIXES.k;
      normalizedUnit = unitStr.slice(1);
    } else if (firstChar === 'm') {
      multiplier = SI_PREFIXES.m_milli;
      normalizedUnit = unitStr.slice(1);
    } else if (firstChar === 'u' || firstChar === 'µ') {
      multiplier = SI_PREFIXES.u;
      normalizedUnit = unitStr.slice(1);
    } else if (firstChar === 'n') {
      multiplier = SI_PREFIXES.n;
      normalizedUnit = unitStr.slice(1);
    } else if (firstChar === 'p') {
      multiplier = SI_PREFIXES.p;
      normalizedUnit = unitStr.slice(1);
    }
  }

  return {
    num: baseNum * multiplier,
    unit: normalizedUnit,
  };
}

/**
 * Calculate Damerau-Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[m][n];
}

/**
 * Core 3-Stage Answer Evaluation Function
 */
export function evaluateAnswerDetailed(
  question: {
    question_type?: string;
    options?: string[] | null;
    correct_answer: any;
  },
  userSelection: string | null | undefined
): EvaluationResult {
  if (userSelection === null || userSelection === undefined || String(userSelection).trim() === '') {
    return {
      isCorrect: false,
      matchType: 'none',
      userAnswerFormatted: 'Not Attempted',
      correctAnswerFormatted: String(question.correct_answer ?? ''),
      feedback: 'Question was skipped or left unattempted.',
    };
  }

  const rawUser = String(userSelection).trim();
  const options = Array.isArray(question.options) ? question.options : [];
  const hasOptions = options.length > 0;
  const correctCandidates = parseCorrectAnswers(question.correct_answer);

  // ══════════════════════════════════════════════════════════
  // 1. MCQ OPTION INDEX / OPTION TEXT MATCHING
  // ══════════════════════════════════════════════════════════
  if (hasOptions) {
    const userAsNum = Number(rawUser);
    const userIsIdx = !isNaN(userAsNum) && userAsNum >= 0 && userAsNum < options.length;

    for (const candidate of correctCandidates) {
      const candAsNum = Number(candidate);
      const candIsIdx = !isNaN(candAsNum) && candAsNum >= 0 && candAsNum < options.length;

      // Both are indices
      if (userIsIdx && candIsIdx) {
        if (userAsNum === candAsNum) {
          return {
            isCorrect: true,
            matchType: 'mcq_index',
            userAnswerFormatted: options[userAsNum] || `Option ${userAsNum + 1}`,
            correctAnswerFormatted: options[candAsNum] || `Option ${candAsNum + 1}`,
            feedback: 'Correct option selected.',
          };
        }
      }

      // User index matches candidate text
      if (userIsIdx) {
        const optText = String(options[userAsNum] || '').trim().toLowerCase();
        if (optText === candidate.toLowerCase() || normalizeText(optText) === normalizeText(candidate)) {
          return {
            isCorrect: true,
            matchType: 'mcq_index',
            userAnswerFormatted: options[userAsNum],
            correctAnswerFormatted: candidate,
            feedback: 'Correct option selected.',
          };
        }
      }

      // Candidate index matches user text
      if (candIsIdx) {
        const candText = String(options[candAsNum] || '').trim().toLowerCase();
        if (rawUser.toLowerCase() === candText || normalizeText(rawUser) === normalizeText(candText)) {
          return {
            isCorrect: true,
            matchType: 'mcq_text',
            userAnswerFormatted: rawUser,
            correctAnswerFormatted: options[candAsNum],
            feedback: 'Correct option text matched.',
          };
        }
      }

      // Direct text-to-text comparison for MCQ options
      if (rawUser.toLowerCase() === candidate.toLowerCase()) {
        return {
          isCorrect: true,
          matchType: 'mcq_text',
          userAnswerFormatted: rawUser,
          correctAnswerFormatted: candidate,
          feedback: 'Correct choice matched.',
        };
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. STAGE 1: CANONICAL NORMALIZATION (FILL-IN-THE-BLANK)
  // ══════════════════════════════════════════════════════════
  const userNorm = normalizeText(rawUser);

  for (const candidate of correctCandidates) {
    const candNorm = normalizeText(candidate);

    // Exact direct string equality (case-insensitive)
    if (rawUser.toLowerCase() === candidate.toLowerCase()) {
      return {
        isCorrect: true,
        matchType: 'exact',
        userAnswerFormatted: rawUser,
        correctAnswerFormatted: candidate,
        feedback: 'Exact answer match.',
      };
    }

    // Normalized equality (ignoring "the", "gate", whitespace, punctuation)
    if (userNorm && candNorm && userNorm === candNorm) {
      return {
        isCorrect: true,
        matchType: 'normalized',
        userAnswerFormatted: rawUser,
        correctAnswerFormatted: candidate,
        feedback: 'Answer matches after standardizing engineering terms.',
      };
    }
  }

  // ══════════════════════════════════════════════════════════
  // 3. STAGE 2: ENGINEERING & SI UNIT SCIENTIFIC SOLVER
  // ══════════════════════════════════════════════════════════
  const userParsed = parseEngineeringValue(rawUser);
  if (userParsed !== null) {
    for (const candidate of correctCandidates) {
      const candParsed = parseEngineeringValue(candidate);
      if (candParsed !== null) {
        // Compare values with 1.5% engineering floating point tolerance
        const diff = Math.abs(userParsed.num - candParsed.num);
        const maxVal = Math.max(Math.abs(userParsed.num), Math.abs(candParsed.num));
        const tolerance = Math.max(1e-5, 0.015 * maxVal);

        if (diff <= tolerance) {
          // If both have units, check unit compatibility
          if (
            userParsed.unit === candParsed.unit ||
            !userParsed.unit ||
            !candParsed.unit ||
            (userParsed.unit.includes('hz') && candParsed.unit.includes('hz')) ||
            (userParsed.unit.includes('v') && candParsed.unit.includes('v'))
          ) {
            return {
              isCorrect: true,
              matchType: 'unit_equivalent',
              userAnswerFormatted: rawUser,
              correctAnswerFormatted: candidate,
              feedback: 'Equivalent numerical value and engineering unit.',
            };
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 4. STAGE 3: GUARDED TYPO TOLERANCE (LEVENSHTEIN DISTANCE)
  // ══════════════════════════════════════════════════════════
  for (const candidate of correctCandidates) {
    const candNorm = normalizeText(candidate);

    // Acronym Shield: Short terms (<= 4 chars) MUST match exactly, no fuzzy allowed!
    const isAcronym = candNorm.length <= 4 || PROTECTED_ACRONYMS.has(candNorm) || PROTECTED_ACRONYMS.has(userNorm);

    if (!isAcronym && userNorm.length >= 5 && candNorm.length >= 5) {
      const dist = levenshteinDistance(userNorm, candNorm);
      const maxLen = Math.max(userNorm.length, candNorm.length);
      const similarity = 1 - dist / maxLen;

      // Allow 1 typo for words 5-8 chars, 2 typos for words > 8 chars (similarity >= 85%)
      const maxAllowedDist = candNorm.length > 8 ? 2 : 1;

      if (dist <= maxAllowedDist && similarity >= 0.84) {
        return {
          isCorrect: true,
          matchType: 'typo_tolerant',
          userAnswerFormatted: rawUser,
          correctAnswerFormatted: candidate,
          feedback: `Accepted with minor technical typo (${Math.round(similarity * 100)}% match).`,
        };
      }
    }
  }

  // No match found
  return {
    isCorrect: false,
    matchType: 'none',
    userAnswerFormatted: rawUser,
    correctAnswerFormatted: correctCandidates[0] || String(question.correct_answer ?? ''),
    feedback: 'Answer does not match the required solution.',
  };
}
