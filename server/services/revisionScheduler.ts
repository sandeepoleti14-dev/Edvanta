export interface RevisionScheduleComputation {
  intervalDays: number;
  scheduledForIso: string;
  reason: string;
  status: 'due' | 'upcoming';
}

export interface RevisionComputationInput {
  masteryScore: number;
  isCorrect: boolean;
  misconceptionDetected: boolean;
  previousRepetitionCount: number;
  now?: Date;
}

/**
 * Spaced-repetition scheduler:
 * - Weak concepts or active misconceptions schedule immediate/1-day revision
 * - Developing concepts schedule 2-4 day intervals
 * - Mastered concepts schedule longer 7-14 day intervals
 */
export function computeNextRevisionSchedule(input: RevisionComputationInput): RevisionScheduleComputation {
  const now = input.now ?? new Date();
  let intervalDays = 1;
  let status: 'due' | 'upcoming' = 'upcoming';
  let reason = '';

  if (input.misconceptionDetected) {
    intervalDays = 0;
    status = 'due';
    reason = 'Immediate targeted review scheduled to resolve detected conceptual misconception.';
  } else if (!input.isCorrect || input.masteryScore < 50) {
    intervalDays = 1;
    status = 'due';
    reason = 'Early spaced-repetition review scheduled because concept mastery is below 50%.';
  } else if (input.masteryScore < 75) {
    intervalDays = Math.min(4, 2 + Math.floor(input.previousRepetitionCount / 2));
    status = 'upcoming';
    reason = `Developing concept reinforcement scheduled in ${intervalDays} days.`;
  } else {
    intervalDays = Math.min(14, 6 + input.previousRepetitionCount * 2);
    status = 'upcoming';
    reason = `Mastery retention check scheduled in ${intervalDays} days.`;
  }

  const targetDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    intervalDays,
    scheduledForIso: targetDate.toISOString(),
    reason,
    status,
  };
}

export function resolveRevisionStatus(scheduledForIso: string, completedAt: string | null, now: Date = new Date()): 'due' | 'upcoming' | 'completed' {
  if (completedAt) {
    return 'completed';
  }
  const scheduledMs = Date.parse(scheduledForIso);
  if (Number.isNaN(scheduledMs)) {
    return 'due';
  }
  // Due if scheduled time is already reached or within next 12 hours
  if (scheduledMs <= now.getTime() + 12 * 60 * 60 * 1000) {
    return 'due';
  }
  return 'upcoming';
}
