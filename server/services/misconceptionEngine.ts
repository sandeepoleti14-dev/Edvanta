export interface ReasoningAnalysisResult {
  source: 'gemini' | 'fallback' | 'rule';
  confidenceStatus: 'identified' | 'uncertain' | 'none';
  misconceptionDetected: boolean;
  misconceptionTitle: string | null;
  conceptualError: string | null;
  correctiveExplanation: string;
  reasoningQuality: 'aligned' | 'partial' | 'flawed' | 'insufficient';
  recommendedFocus: string;
}

const VAGUE_RESPONSES = new Set([
  'idk',
  'na',
  'n/a',
  'none',
  'guess',
  'guessed',
  'not sure',
  'no idea',
  'random',
  'don\'t know',
  'dont know',
]);

/**
 * Checks whether the student provided enough reasoning text to diagnose a conceptual misconception.
 * Prevents hallucinating misconceptions from empty or trivial responses.
 */
export function hasSufficientReasoning(reasoningText: string | null | undefined): boolean {
  if (!reasoningText) return false;
  const trimmed = reasoningText.trim();
  if (trimmed.length < 8) return false;
  const normalized = trimmed.toLowerCase().replace(/[.!?]+/g, '');
  if (VAGUE_RESPONSES.has(normalized)) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length >= 2;
}

export interface FallbackAnalysisInput {
  conceptSlug: string;
  conceptName: string;
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
  explanation: string;
  expectedReasoning: string;
  studentReasoning: string;
}

/**
 * Deterministic misconception analyzer used when Gemini is unavailable or rate-limited.
 */
export function analyzeReasoningDeterministic(input: FallbackAnalysisInput): ReasoningAnalysisResult {
  if (!hasSufficientReasoning(input.studentReasoning)) {
    if (input.isCorrect) {
      return {
        source: 'rule',
        confidenceStatus: 'none',
        misconceptionDetected: false,
        misconceptionTitle: null,
        conceptualError: null,
        correctiveExplanation: input.explanation,
        reasoningQuality: 'insufficient',
        recommendedFocus: `Write out the steps for ${input.conceptName} on your next attempt to verify deep understanding.`,
      };
    }
    return {
      source: 'rule',
      confidenceStatus: 'uncertain',
      misconceptionDetected: false,
      misconceptionTitle: null,
      conceptualError: 'Insufficient reasoning was provided to pinpoint a specific conceptual misconception.',
      correctiveExplanation: `${input.explanation} Expected reasoning: ${input.expectedReasoning}`,
      reasoningQuality: 'insufficient',
      recommendedFocus: `Review the core relationship in ${input.conceptName} and explain your reasoning step-by-step next time.`,
    };
  }

  const text = input.studentReasoning.toLowerCase();

  if (input.isCorrect) {
    // Check if right answer was reached with an inverted or suspicious statement
    if (
      input.conceptSlug === 'ohms-law' &&
      text.includes('increase') &&
      text.includes('current') &&
      text.includes('resistance') &&
      !text.includes('decreas') &&
      !text.includes('inverse') &&
      !text.includes('half')
    ) {
      return {
        source: 'fallback',
        confidenceStatus: 'identified',
        misconceptionDetected: true,
        misconceptionTitle: 'Assumes direct proportionality between current and resistance',
        conceptualError: 'Even though the selected option matched, the written reasoning implies current increases as resistance increases.',
        correctiveExplanation: `According to Ohm's law (I = V / R), current is inversely proportional to resistance at constant voltage. ${input.explanation}`,
        reasoningQuality: 'flawed',
        recommendedFocus: "Practice inverse proportionality problems in Ohm's Law.",
      };
    }

    return {
      source: 'fallback',
      confidenceStatus: 'none',
      misconceptionDetected: false,
      misconceptionTitle: null,
      conceptualError: null,
      correctiveExplanation: input.explanation,
      reasoningQuality: 'aligned',
      recommendedFocus: `Continue advancing to higher-difficulty applications in ${input.conceptName}.`,
    };
  }

  // Incorrect answer with sufficient written reasoning: match common Class 10 Physics misconceptions
  if (
    input.conceptSlug === 'ohms-law' &&
    ((text.includes('increase') && text.includes('current')) || text.includes('proportional') || text.includes('same'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Misunderstands inverse relationship between current and resistance',
      conceptualError: 'Student reasoning treats electric current as increasing or remaining constant when resistance rises at fixed voltage.',
      correctiveExplanation: `By Ohm's Law (I = V / R), resistance opposes charge flow. When resistance increases at constant voltage, current must decrease proportionally.`,
      reasoningQuality: 'flawed',
      recommendedFocus: "Review Ohm's Law (I = V/R) inverse ratio examples.",
    };
  }

  if (
    input.conceptSlug === 'series-circuits' &&
    (text.includes('equal') || text.includes('split') || text.includes('divide') || text.includes('used up') || text.includes('consumed'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Confuses current sharing and voltage division in series circuits',
      conceptualError: 'Student assumes current divides or is consumed in series, or that voltage always splits equally regardless of resistance.',
      correctiveExplanation: `In a series circuit there is only one path, so the exact same current flows through every resistor while voltage drops divide proportionally to resistance (V = I·R).`,
      reasoningQuality: 'flawed',
      recommendedFocus: 'Trace current continuity and voltage drops in multi-resistor series loops.',
    };
  }

  if (
    input.conceptSlug === 'parallel-circuits' &&
    (text.includes('add') || text.includes('sum') || text.includes('reciprocal') || text.includes('equal current') || text.includes('0.5'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Applies series addition or omits reciprocal in parallel resistance',
      conceptualError: 'Student adds branch resistances directly or stops after computing 1/R_eq without inverting back to R_eq.',
      correctiveExplanation: `Parallel branches offer multiple paths, lowering total resistance: compute 1/R_eq = 1/R₁ + 1/R₂ and always take the reciprocal at the end.`,
      reasoningQuality: 'flawed',
      recommendedFocus: 'Practice reciprocal steps and branch-current calculations in parallel circuits.',
    };
  }

  if (
    input.conceptSlug === 'resistance' &&
    (text.includes('same') || text.includes('cancel') || text.includes('half') || text.includes('resistivity changes'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Conflates geometric resistance factors or confuses resistance with resistivity',
      conceptualError: 'Student overlooks how length and cross-sectional area combine in R = ρL/A or treats material resistivity as dimension-dependent.',
      correctiveExplanation: input.explanation,
      reasoningQuality: 'flawed',
      recommendedFocus: 'Compare R = ρL/A geometric scaling against intrinsic resistivity ρ.',
    };
  }

  if (
    (input.conceptSlug === 'electric-power' || input.conceptSlug === 'electrical-energy') &&
    (text.includes('half') || text.includes('linear') || text.includes('3 times') || text.includes('watt') || text.includes('divide'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Assumes linear scaling instead of quadratic V²/R or I²R dependence',
      conceptualError: 'Student applies a linear relationship where power or Joule heating scales with the square of voltage or current.',
      correctiveExplanation: input.explanation,
      reasoningQuality: 'flawed',
      recommendedFocus: 'Drill quadratic scaling in P = V²/R and H = I²Rt.',
    };
  }

  if (
    (input.conceptSlug === 'electric-current' || input.conceptSlug === 'potential-difference') &&
    (text.includes('multiply') || text.includes('minute') || text.includes('divide'))
  ) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: 'Formula inversion or unit conversion oversight',
      conceptualError: 'Student inverted the ratio in I = Q/t or V = W/Q, or left time in minutes instead of converting to SI seconds.',
      correctiveExplanation: input.explanation,
      reasoningQuality: 'partial',
      recommendedFocus: `Verify SI units (coulombs, seconds, joules) and formula rearrangement for ${input.conceptName}.`,
    };
  }

  return {
    source: 'fallback',
    confidenceStatus: 'identified',
    misconceptionDetected: true,
    misconceptionTitle: `Conceptual gap in ${input.conceptName} reasoning`,
    conceptualError: `The reasoning led to "${input.selectedOptionText}" instead of "${input.correctOptionText}".`,
    correctiveExplanation: `${input.explanation} Key reasoning: ${input.expectedReasoning}`,
    reasoningQuality: 'partial',
    recommendedFocus: `Review the fundamental formula and proportional relationships in ${input.conceptName}.`,
  };
}
