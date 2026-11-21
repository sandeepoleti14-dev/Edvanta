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
    if (input.conceptSlug === 'complexity-analysis' && text.includes('always') && text.includes('quadratic')) {
      return {
        source: 'fallback',
        confidenceStatus: 'identified',
        misconceptionDetected: true,
        misconceptionTitle: 'Treats every nested loop as quadratic',
        conceptualError: 'The selected option is correct, but the written reasoning overlooks how the inner loop changes its range.',
        correctiveExplanation: `Analyze each loop independently; a doubling index takes logarithmic iterations. ${input.explanation}`,
        reasoningQuality: 'flawed',
        recommendedFocus: 'Practice counting iterations for loops that double or halve their index.',
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

  const misconceptionByTopic: Record<string, { title: string; clue: boolean; correction: string; focus: string }> = {
    'complexity-analysis': {
      title: 'Miscounts loop iterations',
      clue: text.includes('always') || text.includes('every iteration'),
      correction: 'Count iterations from the update step: doubling or halving an index produces logarithmic work.',
      focus: 'Compare linear, logarithmic, and nested-loop growth.',
    },
    'arrays-hashing': {
      title: 'Misses the HashMap lookup trade-off',
      clue: text.includes('nested') || text.includes('sort') || text.includes('constant space'),
      correction: 'A HashMap reduces average lookup to O(1), usually trading O(N) extra space for a linear scan.',
      focus: 'Practice choosing between brute force, sorting, and hashing.',
    },
    'binary-search-sorting': {
      title: 'Does not preserve the binary-search invariant',
      clue: text.includes('sorted') || text.includes('mid') || text.includes('half'),
      correction: 'Maintain a sorted search range, compute mid without overflow, and discard only a half proven not to contain the target.',
      focus: 'Trace low, mid, and high after every comparison.',
    },
    'recursion-backtracking': {
      title: 'Does not restore recursive state',
      clue: text.includes('base case') || text.includes('remove') || text.includes('copy') || text.includes('stack'),
      correction: 'Backtracking needs a base case, a choice, recursive exploration, and undoing that choice before the next branch.',
      focus: 'Trace the call stack and mutable path for a small input.',
    },
    'linked-lists-stacks': {
      title: 'Loses a pointer during list rewiring',
      clue: text.includes('next') || text.includes('pointer') || text.includes('fast') || text.includes('slow'),
      correction: 'Save the next node before changing links; verify null checks before dereferencing pointers.',
      focus: 'Draw each pointer transition for a three-node list.',
    },
    'trees-bst': {
      title: 'Checks only local tree relationships',
      clue: text.includes('parent') || text.includes('child') || text.includes('ancestor') || text.includes('left') || text.includes('right'),
      correction: 'BST validation must carry lower and upper bounds from every ancestor, not just compare a node with its children.',
      focus: 'Practice DFS with min/max bounds and null base cases.',
    },
    'heaps-priority-queues': {
      title: 'Confuses heap ordering or operation cost',
      clue: text.includes('min') || text.includes('max') || text.includes('peek') || text.includes('poll'),
      correction: 'Java PriorityQueue is a min-heap by default: peek is O(1), while offer and poll are O(log N).',
      focus: 'Choose heap direction and size based on the Top-K requirement.',
    },
    'graphs-dp': {
      title: 'Misses visited-state or subproblem reuse',
      clue: text.includes('visited') || text.includes('cycle') || text.includes('memo') || text.includes('queue'),
      correction: 'Mark graph nodes visited when enqueuing them; memoize repeated DP states to avoid revisiting work.',
      focus: 'Trace BFS queue contents or write the DP state and transition.',
    },
  };
  const rule = misconceptionByTopic[input.conceptSlug];
  if (rule?.clue) {
    return {
      source: 'fallback',
      confidenceStatus: 'identified',
      misconceptionDetected: true,
      misconceptionTitle: rule.title,
      conceptualError: `The reasoning led to "${input.selectedOptionText}" instead of "${input.correctOptionText}".`,
      correctiveExplanation: `${rule.correction} ${input.explanation}`,
      reasoningQuality: 'flawed',
      recommendedFocus: rule.focus,
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
    recommendedFocus: `Review the Java DSA pattern and edge cases in ${input.conceptName}.`,
  };
}
