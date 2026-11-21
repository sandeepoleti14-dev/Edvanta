import { CompanionAction, CompanionMood, LearnerConceptMastery } from '../../shared/types';

export interface CompanionStudentSnapshot {
  studentName: string;
  currentPage?: string;
  activeConceptName?: string;
  streakDays: number;
  overallMastery: number;
  totalAttempted: number;
  accuracyRate: number;
  totalXp: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  unlockedBadgeNames: string[];
  nextLockedBadges: Array<{ title: string; progress: number; target: number }>;
  conceptMasteries: Array<
    Pick<LearnerConceptMastery, 'id' | 'slug' | 'name' | 'masteryScore' | 'status' | 'keyFormula'>
  >;
  completedModulesCount: number;
  incompleteModules: Array<{ conceptId: number; slug: string; title: string }>;
  dueRevisions: Array<{ conceptId: number; conceptName: string; reason: string }>;
  activeMisconceptions: Array<{ conceptName: string; misconceptionTitle: string }>;
  history: Array<{ sender: 'user' | 'companion'; text: string }>;
  message: string;
}

export interface CompanionStructuredResponse {
  reply: string;
  source: 'gemini' | 'fallback';
  mood: CompanionMood;
  actions: CompanionAction[];
  suggestedReplies: string[];
}

export function buildAllowedRouteSet(
  conceptMasteries: CompanionStudentSnapshot['conceptMasteries']
): Set<string> {
  const allowed = new Set<string>([
    '/student/dashboard',
    '/student/modules',
    '/student/flashcards',
    '/student/mock-exam',
    '/student/learning',
    '/student/diagnostic',
    '/student/practice',
    '/student/concept-map',
    '/student/revisions',
    '/student/achievements',
    '/student/analytics',
    '/student/settings',
  ]);
  for (const c of conceptMasteries) {
    allowed.add(`/student/practice?conceptId=${c.id}`);
    allowed.add(`/student/modules?conceptSlug=${c.slug}`);
    allowed.add(`/student/flashcards?conceptSlug=${c.slug}`);
  }
  return allowed;
}

export function sanitizeCompanionActions(
  rawActions: Array<{ label?: string; targetPath?: string }> | undefined,
  allowedRoutes: Set<string>
): CompanionAction[] {
  if (!Array.isArray(rawActions)) return [];
  const seen = new Set<string>();
  const valid: CompanionAction[] = [];

  for (const item of rawActions) {
    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    const targetPath = typeof item?.targetPath === 'string' ? item.targetPath.trim() : '';
    if (!label || !targetPath || !allowedRoutes.has(targetPath) || seen.has(targetPath)) {
      continue;
    }
    seen.add(targetPath);
    valid.push({
      label: label.slice(0, 48),
      type: 'navigate',
      targetPath,
    });
    if (valid.length >= 3) break;
  }
  return valid;
}

function matchConceptFromMessage(
  q: string,
  concepts: CompanionStudentSnapshot['conceptMasteries']
): CompanionStudentSnapshot['conceptMasteries'][number] | undefined {
  const keywordMap: Array<{ slug: string; terms: string[] }> = [
    { slug: 'complexity-analysis', terms: ['complexity', 'big-o', 'big o', 'time complexity', 'space complexity'] },
    { slug: 'arrays-hashing', terms: ['array', 'hashmap', 'hashing', 'two sum', 'prefix sum', 'kadane'] },
    { slug: 'binary-search-sorting', terms: ['binary search', 'sorting', 'merge sort', 'quick sort'] },
    { slug: 'recursion-backtracking', terms: ['recursion', 'backtrack', 'subsets', 'permutation'] },
    { slug: 'linked-lists-stacks', terms: ['linked list', 'stack', 'queue', 'deque', 'two pointer'] },
    { slug: 'trees-bst', terms: ['tree', 'bst', 'binary search tree', 'traversal'] },
    { slug: 'heaps-priority-queues', terms: ['heap', 'priority queue', 'top-k'] },
    { slug: 'graphs-dp', terms: ['graph', 'bfs', 'dfs', 'dynamic programming', 'memoization', 'dp'] },
  ];

  for (const entry of keywordMap) {
    if (entry.terms.some((t) => q.includes(t))) {
      const found = concepts.find((c) => c.slug === entry.slug);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Gives concise answers to common Java DSA complexity questions.
 */
export function answerInlineDsaQuestion(message: string): {
  answerText: string;
  conceptSlug: string;
} | null {
  const q = message.toLowerCase();
  const sizeMatch = q.match(/\b(?:n|size|array of|input of)\s*(?:=|is|of)?\s*(\d+)\b/) ?? q.match(/\b(\d+)\s+(?:element|elements|item|items)\b/);
  const size = sizeMatch ? Number(sizeMatch[1]) : null;

  if (q.includes('binary search')) {
    const steps = size && size > 1 ? Math.ceil(Math.log2(size + 1)) : null;
    return {
      answerText: steps
        ? `Binary search runs in O(log N) time. For ${size} sorted elements, it needs at most about ${steps} comparisons because each step halves the remaining search range.`
        : 'Binary search runs in O(log N) time: each comparison discards half of a sorted search range.',
      conceptSlug: 'binary-search-sorting',
    };
  }
  if (q.includes('two sum') || q.includes('hashmap') || q.includes('hash map')) {
    return {
      answerText: 'A one-pass Two Sum solution stores seen values in a HashMap. It takes O(N) average time and O(N) extra space.',
      conceptSlug: 'arrays-hashing',
    };
  }
  if (q.includes('merge sort') || q.includes('mergesort')) {
    return {
      answerText: 'Merge Sort takes O(N log N) time in best, average, and worst cases, with O(N) auxiliary space for merging.',
      conceptSlug: 'binary-search-sorting',
    };
  }
  if (q.includes('nested loop') && (q.includes('double') || q.includes('*= 2') || q.includes('log'))) {
    return {
      answerText: 'If the outer loop runs N times and the inner index doubles each iteration, total work is N · log₂N, so the time complexity is O(N log N).',
      conceptSlug: 'complexity-analysis',
    };
  }

  return null;
}

export function buildInteractiveFallbackResponse(
  params: CompanionStudentSnapshot
): CompanionStructuredResponse {
  const q = params.message.toLowerCase().trim();
  const matchedConcept = matchConceptFromMessage(q, params.conceptMasteries);

  // 1. Live numerical solver check
  const solved = answerInlineDsaQuestion(params.message);
  if (solved) {
    const concept = params.conceptMasteries.find((c) => c.slug === solved.conceptSlug);
    const actions: CompanionAction[] = concept
      ? [
          {
            label: `Practice ${concept.name}`,
            type: 'navigate',
            targetPath: `/student/practice?conceptId=${concept.id}`,
          },
          {
            label: `Open ${concept.name} Module`,
            type: 'navigate',
            targetPath: `/student/modules?conceptSlug=${concept.slug}`,
          },
        ]
      : [];
    return {
      reply: solved.answerText,
      source: 'fallback',
      mood: 'celebrating',
      actions,
      suggestedReplies: [
        'Test me with a practice question',
        'Explain the formula units',
        'What should I study next?',
      ],
    };
  }

  // 2. Navigation / open page commands
  const wantsNavigation =
    q.includes('open') ||
    q.includes('go to') ||
    q.includes('take me') ||
    q.includes('show me') ||
    q.includes('start') ||
    q.includes('launch');

  if (q.includes('badge') || q.includes('achievement') || q.includes('streak') || q.includes('xp')) {
    const unlockedText =
      params.unlockedBadgeNames.length > 0
        ? `Unlocked so far: ${params.unlockedBadgeNames.slice(0, 4).join(', ')}.`
        : 'Complete a module or diagnostic to unlock your first badge!';
    const nextHint = params.nextLockedBadges[0]
      ? ` Closest next badge: ${params.nextLockedBadges[0].title} (${params.nextLockedBadges[0].progress}/${params.nextLockedBadges[0].target}).`
      : '';
    return {
      reply: `${params.studentName}, you have a ${params.streakDays}-day streak, ${params.totalXp} XP, and ${params.unlockedBadgesCount}/${params.totalBadgesCount} badges unlocked. ${unlockedText}${nextHint}`,
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        { label: 'View Achievements', type: 'navigate', targetPath: '/student/achievements' },
        { label: 'Earn XP in Practice', type: 'navigate', targetPath: '/student/practice' },
      ],
      suggestedReplies: ['Which modules are left?', 'Show my due revisions', 'Give me a quick formula summary'],
    };
  }

  if (q.includes('module') || q.includes('lesson') || q.includes('syllabus') || q.includes('simulator')) {
    if (matchedConcept) {
      return {
        reply: `Let's jump into the ${matchedConcept.name} module (key formula: ${matchedConcept.keyFormula}). You're currently at ${matchedConcept.masteryScore}% mastery there, and the interactive simulator will help lock it in.`,
        source: 'fallback',
        mood: 'celebrating',
        actions: [
          {
            label: `Open ${matchedConcept.name} Module`,
            type: 'navigate',
            targetPath: `/student/modules?conceptSlug=${matchedConcept.slug}`,
          },
          {
            label: `Practice ${matchedConcept.name}`,
            type: 'navigate',
            targetPath: `/student/practice?conceptId=${matchedConcept.id}`,
          },
        ],
        suggestedReplies: [`Explain ${matchedConcept.name}`, 'What should I study next?', 'Check my achievements'],
      };
    }

    const nextMod = params.incompleteModules[0];
    return {
      reply: nextMod
        ? `You have completed ${params.completedModulesCount} of 8 Java DSA modules. Your next module in sequence is "${nextMod.title}".`
        : 'Amazing work—you have completed all 8 Java DSA learning modules!',
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        {
          label: nextMod ? `Open ${nextMod.title.slice(0, 26)}` : 'Review Learning Modules',
          type: 'navigate',
          targetPath: nextMod ? `/student/modules?conceptSlug=${nextMod.slug}` : '/student/modules',
        },
        { label: 'View Concept Map', type: 'navigate', targetPath: '/student/concept-map' },
      ],
      suggestedReplies: ['What are my weak topics?', 'Show my achievements', 'Quiz me on arrays'],
    };
  }

  if (q.includes('revision') || q.includes('review') || q.includes('schedule') || q.includes('due')) {
    const dueSummary =
      params.dueRevisions.length > 0
        ? `You currently have ${params.dueRevisions.length} due revision(s): ${params.dueRevisions
            .slice(0, 3)
            .map((r) => r.conceptName)
            .join(', ')}.`
        : 'Great news—you have no overdue revisions right now!';
    return {
      reply: `${dueSummary} Completing due reviews expands your spaced-repetition interval and strengthens retention.`,
      source: 'fallback',
      mood: params.dueRevisions.length > 0 ? 'encouraging' : 'celebrating',
      actions: [
        { label: 'Open Revision Planner', type: 'navigate', targetPath: '/student/revisions' },
        ...(params.dueRevisions[0]
          ? [
              {
                label: `Practice ${params.dueRevisions[0].conceptName}`,
                type: 'navigate' as const,
                targetPath: `/student/practice?conceptId=${params.dueRevisions[0].conceptId}`,
              },
            ]
          : []),
      ],
      suggestedReplies: ['What misconceptions do I have?', 'Open Concept Map', 'Show my mastery progress'],
    };
  }

  if (q.includes('misconception') || q.includes('mistake') || q.includes('wrong') || q.includes('error')) {
    if (params.activeMisconceptions.length > 0) {
      const m = params.activeMisconceptions[0];
      return {
        reply: `Your active misconception to clear is in ${m.conceptName}: "${m.misconceptionTitle}". Practicing a targeted question with written reasoning will resolve it once your reasoning aligns.`,
        source: 'fallback',
        mood: 'encouraging',
        actions: [
          { label: 'View Misconceptions', type: 'navigate', targetPath: '/student/learning' },
          { label: 'Resolve in Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
        ],
        suggestedReplies: [`Explain ${m.conceptName}`, 'Show my due revisions', 'How is my overall mastery?'],
      };
    }
    return {
      reply: 'You currently have zero unresolved misconceptions—your written reasoning is aligned with the Java DSA concepts you have practiced!',
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        { label: 'View Performance Analytics', type: 'navigate', targetPath: '/student/analytics' },
        { label: 'Try Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
      ],
      suggestedReplies: ['Check my badges & XP', 'Open Learning Modules', 'Quiz me on Big-O'],
    };
  }

  if (q.includes('concept map') || q.includes('graph') || q.includes('prerequisite')) {
    return {
      reply: 'Your interactive concept map connects all 8 Java DSA topics by their prerequisites and colors them by your live mastery status.',
      source: 'fallback',
      mood: 'idle',
      actions: [{ label: 'Open Concept Map', type: 'navigate', targetPath: '/student/concept-map' }],
      suggestedReplies: ['What are my weakest concepts?', 'Open Learning Modules', 'What should I do next?'],
    };
  }

  if (q.includes('flashcard') || q.includes('flash card') || q.includes('recall') || q.includes('memorize')) {
    return {
      reply: matchedConcept
        ? `Active-recall flashcards are ready for ${matchedConcept.name} (${matchedConcept.keyFormula}). Review Java syntax, complexity, and common algorithm pitfalls.`
        : 'EDVANTA flashcards cover high-yield Java syntax, DSA patterns, complexity, and common interview pitfalls.',
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        {
          label: matchedConcept ? `${matchedConcept.name} Flashcards` : 'Open Flashcard Deck',
          type: 'navigate',
          targetPath: matchedConcept ? `/student/flashcards?conceptSlug=${matchedConcept.slug}` : '/student/flashcards',
        },
        { label: 'Take Timed Mock Exam', type: 'navigate', targetPath: '/student/mock-exam' },
      ],
      suggestedReplies: ['Start a timed mock exam', 'Give me a DSA cheat sheet', 'What should I study next?'],
    };
  }

  if (q.includes('mock') || q.includes('exam') || q.includes('coach')) {
    return {
      reply: 'The timed mock exam tests all 8 Java DSA topics with a question palette, countdown timer, and instant EDVANTA Coach AI analysis.',
      source: 'fallback',
      mood: 'encouraging',
      actions: [
        { label: 'Open Mock Exam Hub', type: 'navigate', targetPath: '/student/mock-exam' },
        { label: 'Review Flashcards First', type: 'navigate', targetPath: '/student/flashcards' },
      ],
      suggestedReplies: ['What are my weak concepts?', 'Open Flashcards', 'Show my due revisions'],
    };
  }

  if (q.includes('diagnostic') || q.includes('baseline')) {
    return {
      reply: 'The 8-question Java DSA diagnostic calibrates your baseline mastery across every topic and builds your initial revision schedule.',
      source: 'fallback',
      mood: 'idle',
      actions: [{ label: 'Open Diagnostic Test', type: 'navigate', targetPath: '/student/diagnostic' }],
      suggestedReplies: ['How is my overall mastery?', 'Open Learning Modules', 'Start Adaptive Practice'],
    };
  }

  if (q.includes('quiz') || q.includes('practice') || q.includes('test me')) {
    const target =
      matchedConcept ??
      [...params.conceptMasteries].sort((a, b) => a.masteryScore - b.masteryScore)[0];
    return {
      reply: target
        ? `Ready when you are! Let's drill ${target.name} (currently ${target.masteryScore}% mastery). Remember to include your reasoning so I can check for hidden misconceptions.`
        : 'Ready for a fresh adaptive question! Click below to launch Adaptive Practice.',
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        {
          label: target ? `Practice ${target.name}` : 'Start Adaptive Practice',
          type: 'navigate',
          targetPath: target ? `/student/practice?conceptId=${target.id}` : '/student/practice',
        },
        ...(target
          ? [
              {
                label: `Review ${target.name} Module`,
                type: 'navigate' as const,
                targetPath: `/student/modules?conceptSlug=${target.slug}`,
              },
            ]
          : []),
      ],
      suggestedReplies: ['Give me a DSA cheat sheet', 'Show my due revisions', 'Check my XP & badges'],
    };
  }

  if (q.includes('formula') || q.includes('cheat sheet') || q.includes('summary') || q.includes('syntax')) {
    const formulaList = params.conceptMasteries
      .map((c) => `${c.name}: ${c.keyFormula}`)
      .join(' | ');
    return {
      reply: `Here is your Java DSA quick reference: ${formulaList}. Ask me to explain any pattern or complexity!`,
      source: 'fallback',
      mood: 'idle',
      actions: [
        { label: 'Explore Algorithm Labs', type: 'navigate', targetPath: '/student/modules' },
        { label: 'Practice DSA', type: 'navigate', targetPath: '/student/practice' },
      ],
      suggestedReplies: ['Explain binary search', 'How does a HashMap help?', 'BFS vs DFS'],
    };
  }

  if (
    q.includes('progress') ||
    q.includes('mastery') ||
    q.includes('weak') ||
    q.includes('strong') ||
    q.includes('focus') ||
    q.includes('next') ||
    q.includes('analytics') ||
    q.includes('how am i')
  ) {
    const sorted = [...params.conceptMasteries].sort((a, b) => a.masteryScore - b.masteryScore);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    return {
      reply: `Your overall mastery is ${params.overallMastery}% across ${params.totalAttempted} questions (${params.accuracyRate}% accuracy, ${params.streakDays}-day streak). Strongest: ${strongest.name} (${strongest.masteryScore}%). Top priority next: ${weakest.name} (${weakest.masteryScore}%).`,
      source: 'fallback',
      mood: 'encouraging',
      actions: [
        {
          label: `Practice ${weakest.name}`,
          type: 'navigate',
          targetPath: `/student/practice?conceptId=${weakest.id}`,
        },
        {
          label: `Open ${weakest.name} Module`,
          type: 'navigate',
          targetPath: `/student/modules?conceptSlug=${weakest.slug}`,
        },
        { label: 'Full Analytics', type: 'navigate', targetPath: '/student/analytics' },
      ],
      suggestedReplies: ['Show my due revisions', 'Check my badges & streak', 'What misconceptions do I have?'],
    };
  }

  // 3. Topic-specific Java DSA tutoring
  if (matchedConcept) {
    const reply = `${matchedConcept.name}: a useful pattern to remember is ${matchedConcept.keyFormula}. Your current mastery is ${matchedConcept.masteryScore}%.`;

    return {
      reply: wantsNavigation ? `Opening ${matchedConcept.name} resources for you! ${reply}` : reply,
      source: 'fallback',
      mood: 'idle',
      actions: [
        {
          label: `Open ${matchedConcept.name} Module`,
          type: 'navigate',
          targetPath: `/student/modules?conceptSlug=${matchedConcept.slug}`,
        },
        {
          label: `Practice ${matchedConcept.name}`,
          type: 'navigate',
          targetPath: `/student/practice?conceptId=${matchedConcept.id}`,
        },
      ],
      suggestedReplies: [
        `Quiz me on ${matchedConcept.name}`,
        'Give me a formula cheat sheet',
        'What should I study next?',
      ],
    };
  }

  // 4. Conversational greetings / open-ended catch-all
  if (q.match(/^(hi|hello|hey|yo|good morning|good evening|thanks|thank you)\b/)) {
    return {
      reply: `Hey ${params.studentName}! I'm Byte—I can explain Java DSA topics, walk through algorithm complexity, help you practice interview patterns, or check your streak, XP, and revisions. What would you like to work on?`,
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        { label: 'Learning Modules', type: 'navigate', targetPath: '/student/modules' },
        { label: 'Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
        { label: 'Achievements', type: 'navigate', targetPath: '/student/achievements' },
      ],
      suggestedReplies: ['What should I study next?', 'Check my badges & streak', 'Explain binary search'],
    };
  }

  const topWeak = [...params.conceptMasteries].sort((a, b) => a.masteryScore - b.masteryScore)[0];
  return {
    reply: `I can help with your EDVANTA Java DSA workspace! Ask "What should I study next?", "Explain binary search complexity", "Show my badges and streak", or "Open ${topWeak?.name || 'Arrays & Hashing'} module".`,
    source: 'fallback',
    mood: 'idle',
    actions: topWeak
      ? [
          {
            label: `Practice ${topWeak.name}`,
            type: 'navigate',
            targetPath: `/student/practice?conceptId=${topWeak.id}`,
          },
          { label: 'Open Learning Modules', type: 'navigate', targetPath: '/student/modules' },
        ]
      : [{ label: 'Open Dashboard', type: 'navigate', targetPath: '/student/dashboard' }],
    suggestedReplies: ['What should I study next?', 'Give me a DSA cheat sheet', 'Show my due revisions'],
  };
}
