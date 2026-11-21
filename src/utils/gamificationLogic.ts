import { DailyQuestItem, WeeklyActivityDay } from '../../shared/types';

export interface ActivityXpInput {
  badgeXp: number;
  totalAttempted: number;
  correctAttempts: number;
  completedModulesCount: number;
  knownFlashcardsCount: number;
  completedMockExamsCount: number;
}

const LEVEL_TITLES = [
  'Code Apprentice',
  'Array Explorer',
  'Algo Navigator',
  'Stack Strategist',
  'Tree Architect',
  'Graph Explorer',
  'Code Vanguard',
  'DSA Luminary',
];

export function computeActivityXp(input: ActivityXpInput): number {
  const safe = (v: number) => Math.max(0, Math.floor(v));
  return (
    safe(input.badgeXp) +
    safe(input.totalAttempted) * 10 +
    safe(input.correctAttempts) * 5 +
    safe(input.completedModulesCount) * 40 +
    safe(input.knownFlashcardsCount) * 8 +
    safe(input.completedMockExamsCount) * 60
  );
}

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return 200 + (safeLevel - 1) * 75;
}

export function computeLearnerLevel(totalXp: number): {
  level: number;
  levelTitle: string;
  totalXp: number;
  xpInLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
  progressPercent: number;
} {
  const cleanXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let remaining = cleanXp;
  let threshold = xpRequiredForLevel(level);

  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = xpRequiredForLevel(level);
  }

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const progressPercent = Math.min(100, Math.round((remaining / threshold) * 100));

  return {
    level,
    levelTitle: LEVEL_TITLES[titleIndex],
    totalXp: cleanXp,
    xpInLevel: remaining,
    xpForNextLevel: threshold,
    xpRemaining: Math.max(0, threshold - remaining),
    progressPercent,
  };
}

export function computeCompanionTier(level: number): {
  tier: number;
  title: string;
  unlockHint: string;
} {
  if (level >= 7) {
    return {
      tier: 4,
      title: 'Code Ace',
      unlockHint: 'Maximum companion level unlocked.',
    };
  }
  if (level >= 5) {
    return {
      tier: 3,
      title: 'Quantum Mentor',
      unlockHint: 'Reach Level 7 to evolve Byte to Code Ace.',
    };
  }
  if (level >= 3) {
    return {
      tier: 2,
      title: 'Neural Guide',
      unlockHint: 'Reach Level 5 to evolve Byte to Quantum Mentor.',
    };
  }
  return {
    tier: 1,
    title: 'Code Scout',
    unlockHint: 'Reach Level 3 to evolve Byte to Neural Guide.',
  };
}

const UTC_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildWeeklyActivityCalendar(params: {
  activityCountsByDate: Record<string, number>;
  referenceDateIso?: string;
}): WeeklyActivityDay[] {
  const refDate = params.referenceDateIso ? new Date(params.referenceDateIso) : new Date();
  const baseUtcMs = Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate());
  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayKey = new Date(baseUtcMs).toISOString().slice(0, 10);

  const days: WeeklyActivityDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(baseUtcMs - offset * oneDayMs);
    const key = d.toISOString().slice(0, 10);
    const count = Math.max(0, Math.floor(params.activityCountsByDate[key] ?? 0));
    days.push({
      date: key,
      dayLabel: UTC_WEEKDAY_LABELS[d.getUTCDay()],
      count,
      active: count > 0,
      isToday: key === todayKey,
    });
  }
  return days;
}

export function buildLearningQuests(params: {
  todayActions: number;
  dailyGoalTarget: number;
  completedModulesCount: number;
  knownFlashcardsCount: number;
  masteredCount: number;
  resolvedMisconceptionsCount: number;
}): DailyQuestItem[] {
  const dailyDone = Math.min(params.todayActions, params.dailyGoalTarget);
  return [
    {
      id: 'quest-daily-goal',
      title: 'Daily Learning Target',
      description: `Complete ${params.dailyGoalTarget} practice questions, modules, or card reviews today.`,
      progress: dailyDone,
      target: params.dailyGoalTarget,
      xpReward: 50,
      completed: params.todayActions >= params.dailyGoalTarget,
    },
    {
      id: 'quest-syllabus-modules',
      title: 'Syllabus Explorer',
      description: 'Finish 4 interactive Java DSA modules with Quick Checks.',
      progress: Math.min(params.completedModulesCount, 4),
      target: 4,
      xpReward: 120,
      completed: params.completedModulesCount >= 4,
    },
    {
      id: 'quest-recall-deck',
      title: 'Active Recall Sprint',
      description: 'Mark 8 flashcards as Known in the Java DSA recall deck.',
      progress: Math.min(params.knownFlashcardsCount, 8),
      target: 8,
      xpReward: 90,
      completed: params.knownFlashcardsCount >= 8,
    },
    {
      id: 'quest-concept-mastery',
      title: 'Misconception Buster',
      description: 'Master at least 3 Java DSA topics with 75%+ mastery.',
      progress: Math.min(params.masteredCount, 3),
      target: 3,
      xpReward: 150,
      completed: params.masteredCount >= 3,
    },
  ];
}
