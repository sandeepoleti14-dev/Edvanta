import { Difficulty, LearnerConceptMastery } from '../../shared/types';

export interface AdaptiveTarget {
  concept: LearnerConceptMastery;
  difficulty: Difficulty;
  reason: string;
}

/**
 * Selects the optimal next concept and difficulty level based on:
 * 1. Weak concepts and unstarted prerequisites first
 * 2. Avoiding repetitive drilling of already-mastered concepts when weaker ones exist
 * 3. Adapting difficulty to current concept mastery
 */
export function selectAdaptiveTarget(
  conceptMasteries: LearnerConceptMastery[],
  recentConceptIds: number[] = [],
  preferredConceptId?: number
): AdaptiveTarget {
  if (conceptMasteries.length === 0) {
    throw new Error('Cannot select adaptive target from empty concept list');
  }

  if (preferredConceptId !== undefined) {
    const preferred = conceptMasteries.find((c) => c.id === preferredConceptId);
    if (preferred) {
      return {
        concept: preferred,
        difficulty: pickDifficultyForMastery(preferred.masteryScore, preferred.attemptCount),
        reason: `Targeted practice requested for ${preferred.name} (${preferred.masteryScore}% mastery).`,
      };
    }
  }

  const masteryById = new Map<number, LearnerConceptMastery>();
  for (const c of conceptMasteries) {
    masteryById.set(c.id, c);
  }

  const lastConceptId = recentConceptIds[0];

  const scored = conceptMasteries.map((concept) => {
    const weakness = concept.attemptCount === 0 ? 68 : 100 - concept.masteryScore;

    // Bonus if prerequisites are reasonably ready (>= 50% or not started yet)
    const prereqsReady =
      concept.prerequisites.length === 0 ||
      concept.prerequisites.every((pid) => {
        const prereq = masteryById.get(pid);
        return !prereq || prereq.masteryScore >= 45;
      });
    const prereqBonus = prereqsReady ? 14 : -12;

    // Penalize repeating the exact same concept back-to-back if alternatives exist
    const repeatPenalty = concept.id === lastConceptId && conceptMasteries.length > 1 ? -18 : 0;

    // Mastered concepts receive lower priority so weak concepts get focused attention
    const masteredPenalty = concept.status === 'mastered' ? -30 : 0;

    const priority = weakness + prereqBonus + repeatPenalty + masteredPenalty;

    return { concept, priority, prereqsReady };
  });

  scored.sort((a, b) => b.priority - a.priority);
  const chosen = scored[0];
  const difficulty = pickDifficultyForMastery(chosen.concept.masteryScore, chosen.concept.attemptCount);

  let reason = '';
  if (chosen.concept.attemptCount === 0) {
    reason = `Establishing baseline understanding in ${chosen.concept.name}.`;
  } else if (chosen.concept.status === 'weak') {
    reason = `Targeting weak concept ${chosen.concept.name} (${chosen.concept.masteryScore}% mastery) with ${difficulty}-level reinforcement.`;
  } else if (chosen.concept.status === 'developing') {
    reason = `Building fluency in ${chosen.concept.name} (${chosen.concept.masteryScore}% mastery) at ${difficulty} difficulty.`;
  } else {
    reason = `Challenging mastery retention in ${chosen.concept.name} (${chosen.concept.masteryScore}% mastery) with ${difficulty} application.`;
  }

  return {
    concept: chosen.concept,
    difficulty,
    reason,
  };
}

export function pickDifficultyForMastery(masteryScore: number, attemptCount: number): Difficulty {
  if (attemptCount === 0) return 'easy';
  if (masteryScore < 45) return 'easy';
  if (masteryScore < 75) return 'medium';
  return 'hard';
}
