import { AchievementBadge, AchievementCategory, LearnerConceptMastery } from '../../shared/types';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
  target: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: 'first_diagnostic',
    title: 'Baseline Calibrated',
    description: 'Complete the Java DSA diagnostic to initialize your learner profile.',
    category: 'consistency',
    xpReward: 100,
    target: 1,
  },
  {
    id: 'streak_3',
    title: '3-Day Momentum',
    description: 'Practice or complete a learning module for 3 consecutive days.',
    category: 'streak',
    xpReward: 150,
    target: 3,
  },
  {
    id: 'streak_5',
    title: 'Consistent Scholar',
    description: 'Sustain a 5-day daily study streak across Java DSA topics.',
    category: 'streak',
    xpReward: 250,
    target: 5,
  },
  {
    id: 'streak_7',
    title: 'Weekly Champion',
    description: 'Maintain an unbroken 7-day study and practice streak.',
    category: 'streak',
    xpReward: 400,
    target: 7,
  },
  {
    id: 'first_mastery',
    title: 'Concept Master',
    description: 'Reach 75% or higher mastery on any Java DSA topic.',
    category: 'mastery',
    xpReward: 150,
    target: 1,
  },
  {
    id: 'pattern_architect',
    title: 'Pattern Architect',
    description: 'Achieve 75%+ mastery in both Arrays & Hashing and Graphs & Dynamic Programming.',
    category: 'mastery',
    xpReward: 300,
    target: 2,
  },
  {
    id: 'syllabus_master',
    title: 'DSA Laureate',
    description: 'Master at least 6 of the 8 Java DSA topics.',
    category: 'mastery',
    xpReward: 500,
    target: 6,
  },
  {
    id: 'misconception_buster',
    title: 'Misconception Buster',
    description: 'Resolve a diagnosed conceptual misconception with aligned reasoning.',
    category: 'consistency',
    xpReward: 200,
    target: 1,
  },
  {
    id: 'module_explorer',
    title: 'Module Explorer',
    description: 'Complete 3 structured syllabus learning modules.',
    category: 'curriculum',
    xpReward: 150,
    target: 3,
  },
  {
    id: 'syllabus_scholar',
    title: 'Syllabus Scholar',
    description: 'Complete all 8 Java DSA learning modules.',
    category: 'curriculum',
    xpReward: 350,
    target: 8,
  },
];

export interface StreakComputationInput {
  currentStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD or ISO string
  today?: Date;
}

export function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes the updated daily streak cleanly in UTC calendar days.
 */
export function computeUpdatedStreak(input: StreakComputationInput): {
  newStreak: number;
  activityDateKey: string;
} {
  const now = input.today ?? new Date();
  const todayKey = toUtcDateKey(now);

  if (!input.lastActivityDate) {
    return { newStreak: Math.max(1, input.currentStreak), activityDateKey: todayKey };
  }

  const lastKey = input.lastActivityDate.slice(0, 10);
  if (lastKey === todayKey) {
    return { newStreak: Math.max(1, input.currentStreak), activityDateKey: todayKey };
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = toUtcDateKey(yesterday);

  if (lastKey === yesterdayKey) {
    return { newStreak: Math.max(1, input.currentStreak) + 1, activityDateKey: todayKey };
  }

  // Gap of > 1 day resets streak to 1 for today's activity
  return { newStreak: 1, activityDateKey: todayKey };
}

export interface AchievementEvaluationInput {
  streakDays: number;
  diagnosticCount: number;
  conceptMasteries: LearnerConceptMastery[];
  resolvedMisconceptionsCount: number;
  completedModulesCount: number;
  unlockedMap: Map<string, string>; // badgeId -> unlockedAt ISO
}

export function evaluateAchievements(input: AchievementEvaluationInput): {
  badges: AchievementBadge[];
  newlyUnlocked: AchievementBadge[];
  totalXp: number;
} {
  const masteredCount = input.conceptMasteries.filter((c) => c.status === 'mastered').length;
  const arraysMastered = input.conceptMasteries.some(
    (c) => c.slug === 'arrays-hashing' && c.status === 'mastered'
  )
    ? 1
    : 0;
  const graphsMastered = input.conceptMasteries.some(
    (c) => c.slug === 'graphs-dp' && c.status === 'mastered'
  )
    ? 1
    : 0;

  const progressById: Record<string, number> = {
    first_diagnostic: Math.min(1, input.diagnosticCount),
    streak_3: Math.min(3, input.streakDays),
    streak_5: Math.min(5, input.streakDays),
    streak_7: Math.min(7, input.streakDays),
    first_mastery: Math.min(1, masteredCount),
    pattern_architect: arraysMastered + graphsMastered,
    syllabus_master: Math.min(6, masteredCount),
    misconception_buster: Math.min(1, input.resolvedMisconceptionsCount),
    module_explorer: Math.min(3, input.completedModulesCount),
    syllabus_scholar: Math.min(8, input.completedModulesCount),
  };

  const newlyUnlocked: AchievementBadge[] = [];
  let totalXp = 0;

  const badges: AchievementBadge[] = ACHIEVEMENT_CATALOG.map((def) => {
    const progress = progressById[def.id] ?? 0;
    const existingUnlockedAt = input.unlockedMap.get(def.id) ?? null;
    const isNowUnlocked = Boolean(existingUnlockedAt) || progress >= def.target;

    const badge: AchievementBadge = {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      xpReward: def.xpReward,
      target: def.target,
      progress,
      unlocked: isNowUnlocked,
      unlockedAt: existingUnlockedAt,
    };

    if (isNowUnlocked) {
      totalXp += def.xpReward;
      if (!existingUnlockedAt) {
        newlyUnlocked.push(badge);
      }
    }

    return badge;
  });

  return { badges, newlyUnlocked, totalXp };
}
