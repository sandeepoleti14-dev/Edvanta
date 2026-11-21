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
    { slug: 'electric-current', terms: ['electric current', 'current', 'charge', 'coulomb', 'ampere', 'q=it', 'i=q/t'] },
    { slug: 'potential-difference', terms: ['potential difference', 'potential', 'voltage', 'volt', 'voltmeter', 'w=vq'] },
    { slug: 'ohms-law', terms: ['ohm', 'v=ir', 'v = ir', 'v-i'] },
    { slug: 'resistance', terms: ['resistance', 'resistivity', 'rho', 'length', 'cross-section', 'stretch'] },
    { slug: 'series-circuits', terms: ['series'] },
    { slug: 'parallel-circuits', terms: ['parallel'] },
    { slug: 'electric-power', terms: ['power', 'watt', 'rating', 'bulb'] },
    { slug: 'electrical-energy', terms: ['energy', 'joule', 'kwh', 'kilowatt', 'heat', 'heating'] },
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
 * Solves simple Class 10 Physics numerical questions inline when the user supplies values + units.
 */
export function solveInlinePhysicsNumerical(message: string): {
  answerText: string;
  conceptSlug: string;
} | null {
  const q = message.toLowerCase();

  const vMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:v|volt|volts)\b/);
  const iMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:a|amp|amps|ampere|amperes)\b/);
  const rMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:ω|ohm|ohms)\b/);
  const qMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:c|coulomb|coulombs)\b/);
  const tSecMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/);
  const tMinMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/);
  const pMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:w|watt|watts)\b/);
  const hMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);

  // 1. Ohm's Law: any two of V, I, R (unless specifically asking for power)
  const asksPower = q.includes('power') || q.includes('watt');
  if (!asksPower && vMatch && rMatch && !iMatch) {
    const V = Number(vMatch[1]);
    const R = Number(rMatch[1]);
    if (R > 0) {
      const I = V / R;
      return {
        answerText: `Using Ohm's Law (I = V / R): I = ${V} V / ${R} Ω = ${Number(I.toFixed(3))} A.`,
        conceptSlug: 'ohms-law',
      };
    }
  }
  if (!asksPower && iMatch && rMatch && !vMatch) {
    const I = Number(iMatch[1]);
    const R = Number(rMatch[1]);
    const V = I * R;
    return {
      answerText: `Using Ohm's Law (V = I × R): V = ${I} A × ${R} Ω = ${Number(V.toFixed(3))} V.`,
      conceptSlug: 'ohms-law',
    };
  }
  if (!asksPower && vMatch && iMatch && !rMatch) {
    const V = Number(vMatch[1]);
    const I = Number(iMatch[1]);
    if (I > 0) {
      const R = V / I;
      return {
        answerText: `Using Ohm's Law (R = V / I): R = ${V} V / ${I} A = ${Number(R.toFixed(3))} Ω.`,
        conceptSlug: 'ohms-law',
      };
    }
  }

  // 2. Electric Power: V and I, or V and R, or P and V
  if (asksPower && vMatch && iMatch) {
    const V = Number(vMatch[1]);
    const I = Number(iMatch[1]);
    const P = V * I;
    return {
      answerText: `Using Electric Power (P = V × I): P = ${V} V × ${I} A = ${Number(P.toFixed(2))} W.`,
      conceptSlug: 'electric-power',
    };
  }
  if (asksPower && vMatch && rMatch) {
    const V = Number(vMatch[1]);
    const R = Number(rMatch[1]);
    if (R > 0) {
      const P = (V * V) / R;
      return {
        answerText: `Using Electric Power (P = V² / R): P = ${V}² / ${R} = ${Number(P.toFixed(2))} W.`,
        conceptSlug: 'electric-power',
      };
    }
  }
  if (pMatch && vMatch && !hMatch) {
    const P = Number(pMatch[1]);
    const V = Number(vMatch[1]);
    if (V > 0) {
      const I = P / V;
      const R = (V * V) / P;
      return {
        answerText: `From P = V × I: current I = ${P} W / ${V} V = ${Number(I.toFixed(3))} A, and element resistance R = V² / P = ${Number(R.toFixed(2))} Ω.`,
        conceptSlug: 'electric-power',
      };
    }
  }

  // 3. Electric Current: Q and t
  if (qMatch && (tSecMatch || tMinMatch)) {
    const Q = Number(qMatch[1]);
    const t = tSecMatch ? Number(tSecMatch[1]) : Number(tMinMatch![1]) * 60;
    if (t > 0) {
      const I = Q / t;
      return {
        answerText: `Using I = Q / t (converting time to ${t} s): I = ${Q} C / ${t} s = ${Number(I.toFixed(3))} A.`,
        conceptSlug: 'electric-current',
      };
    }
  }

  // 4. Electrical Energy in kWh: P (W) and hours
  if (pMatch && hMatch) {
    const W = Number(pMatch[1]);
    const h = Number(hMatch[1]);
    const kwh = (W / 1000) * h;
    return {
      answerText: `Converting ${W} W to ${W / 1000} kW: Energy E = ${W / 1000} kW × ${h} h = ${Number(
        kwh.toFixed(3)
      )} kWh (${(kwh * 3.6e6).toExponential(2)} J).`,
      conceptSlug: 'electrical-energy',
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
  const solved = solveInlinePhysicsNumerical(params.message);
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
        ? `You have completed ${params.completedModulesCount} of 8 Electricity syllabus modules. Your next module in sequence is "${nextMod.title}".`
        : 'Amazing work—you have completed all 8 Class 10 Electricity learning modules!',
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
      suggestedReplies: ['What are my weak concepts?', 'Show my achievements', 'Quiz me on Circuits'],
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
      reply: 'You currently have zero unresolved misconceptions—your written reasoning is well aligned with Class 10 Physics laws!',
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        { label: 'View Performance Analytics', type: 'navigate', targetPath: '/student/analytics' },
        { label: 'Try Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
      ],
      suggestedReplies: ['Check my badges & XP', 'Open Learning Modules', 'Quiz me on Electric Power'],
    };
  }

  if (q.includes('concept map') || q.includes('graph') || q.includes('prerequisite')) {
    return {
      reply: 'Your interactive Concept Knowledge Graph maps all 8 Electricity topics from Electric Current up to Joule Heating, color-coded by your live mastery status.',
      source: 'fallback',
      mood: 'idle',
      actions: [{ label: 'Open Concept Map', type: 'navigate', targetPath: '/student/concept-map' }],
      suggestedReplies: ['What are my weakest concepts?', 'Open Learning Modules', 'What should I do next?'],
    };
  }

  if (q.includes('flashcard') || q.includes('flash card') || q.includes('recall') || q.includes('memorize')) {
    return {
      reply: matchedConcept
        ? `Active-recall flashcards are ready for ${matchedConcept.name} (${matchedConcept.keyFormula}). Flip through definitions, SI units, and exam traps—and mark tricky cards as "Needs Review".`
        : 'EDVANTA Flashcards cover all 24 high-yield Electricity formulas, circuit rules, and exam traps. Practice them daily to boost recall speed before mock exams!',
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
      suggestedReplies: ['Start a timed mock exam', 'Give me a formula cheat sheet', 'What should I study next?'],
    };
  }

  if (q.includes('mock') || q.includes('exam') || q.includes('coach')) {
    return {
      reply: 'The Timed Mock Exam tests all 8 Class 10 Electricity concepts in a 15-minute board-style simulation with a question palette, countdown timer, and instant EDVANTA Coach AI Result Analysis.',
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
      reply: 'The 8-question Electricity Diagnostic calibrates your baseline mastery across every syllabus concept and builds your initial revision schedule.',
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
      suggestedReplies: ['Give me a formula cheat sheet', 'Show my due revisions', 'Check my XP & badges'],
    };
  }

  if (q.includes('formula') || q.includes('cheat sheet') || q.includes('summary')) {
    const formulaList = params.conceptMasteries
      .map((c) => `${c.name}: ${c.keyFormula}`)
      .join(' | ');
    return {
      reply: `Here are all 8 Class 10 Electricity formulas: ${formulaList}. Ask me to solve a numerical with any of these!`,
      source: 'fallback',
      mood: 'idle',
      actions: [
        { label: 'Explore Simulators', type: 'navigate', targetPath: '/student/modules' },
        { label: 'Practice Formulas', type: 'navigate', targetPath: '/student/practice' },
      ],
      suggestedReplies: ['Solve I for 12V and 4 ohms', "Explain Ohm's Law", 'Series vs Parallel rule'],
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

  // 3. Concept-specific Physics tutoring
  if (matchedConcept) {
    const explanations: Record<string, string> = {
      'electric-current':
        'Electric current (I = Q / t) is the rate of charge flow in Amperes (1 A = 1 C/s). Always convert minutes into seconds before multiplying Q = I × t.',
      'potential-difference':
        'Potential difference (V = W / Q) is the work done moving 1 Coulomb between two points (1 V = 1 J/C). Voltmeters have high resistance and always connect in parallel.',
      'ohms-law':
        "Ohm's Law (V = I × R) holds at constant temperature. At fixed voltage, current I = V / R is inversely proportional to resistance—doubling R halves I!",
      resistance:
        'Resistance R = ρ(L / A) depends on wire length L and area A, while resistivity ρ depends only on material and temperature. Stretching a wire to 2L halves area A/2, making R 4× larger.',
      'series-circuits':
        'In a series loop, identical current flows through every resistor (I₁ = I₂), while supply voltage divides proportionally to resistance: R_eq = R₁ + R₂.',
      'parallel-circuits':
        'In parallel branches, every branch receives full supply voltage (V₁ = V₂ = V) and equivalent resistance drops via 1/R_eq = 1/R₁ + 1/R₂—always invert the sum at the end!',
      'electric-power':
        'Electric power is P = V × I = I²R = V²/R. Use P = V²/R when voltage is fixed (like parallel bulbs) and P = I²R when current is shared (like series resistors).',
      'electrical-energy':
        "Joule's heating law is H = I²Rt (in Joules, with t in seconds). Household electricity billing uses kWh: E = (Watts / 1000) × hours (1 kWh = 3.6 × 10⁶ J).",
    };
    const reply =
      explanations[matchedConcept.slug] ??
      `${matchedConcept.name} uses ${matchedConcept.keyFormula}. Your current mastery is ${matchedConcept.masteryScore}%.`;

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
      reply: `Hey ${params.studentName}! I'm Volt—I can explain any Class 10 Electricity topic, solve numericals (like "find current for 12V and 4 ohms"), check your streak/XP/revisions, or jump straight to any module or practice drill. What would you like to do?`,
      source: 'fallback',
      mood: 'celebrating',
      actions: [
        { label: 'Learning Modules', type: 'navigate', targetPath: '/student/modules' },
        { label: 'Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
        { label: 'Achievements', type: 'navigate', targetPath: '/student/achievements' },
      ],
      suggestedReplies: ['What should I study next?', 'Check my badges & streak', 'Solve I for 12V and 4 ohms'],
    };
  }

  const topWeak = [...params.conceptMasteries].sort((a, b) => a.masteryScore - b.masteryScore)[0];
  return {
    reply: `I can help with your EDVANTA workspace and Class 10 Electricity! Try asking me things like "What should I study next?", "Solve current for 18V and 6 ohms", "Show my badges and streak", or "Open ${topWeak?.name || "Ohm's Law"} module".`,
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
    suggestedReplies: ['What should I study next?', 'Give me a formula cheat sheet', 'Show my due revisions'],
  };
}
