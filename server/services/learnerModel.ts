import { Difficulty, MasteryStatus } from '../../shared/types';

export function deriveMasteryStatus(masteryScore: number, attemptCount: number): MasteryStatus {
  if (attemptCount <= 0) {
    return 'not_started';
  }
  if (masteryScore < 50) {
    return 'weak';
  }
  if (masteryScore < 75) {
    return 'developing';
  }
  return 'mastered';
}

export interface MasteryUpdateInput {
  currentScore: number;
  currentAttempts: number;
  isCorrect: boolean;
  difficulty: Difficulty;
  misconceptionDetected: boolean;
  reasoningQuality: 'aligned' | 'partial' | 'flawed' | 'insufficient';
  isDiagnostic?: boolean;
}

export interface MasteryUpdateOutput {
  newScore: number;
  newAttempts: number;
  newStatus: MasteryStatus;
  delta: number;
}

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.35,
  hard: 1.7,
};

/**
 * Transparent backend-controlled mastery scoring algorithm.
 * Never lets an LLM invent mastery percentages directly.
 */
export function computeUpdatedMastery(input: MasteryUpdateInput): MasteryUpdateOutput {
  const weight = DIFFICULTY_WEIGHT[input.difficulty] ?? 1.0;

  if (input.isDiagnostic && input.currentAttempts === 0) {
    // Baseline calibration for a student's first diagnostic encounter on a concept
    let baseline = input.isCorrect ? 72 : 34;
    if (input.isCorrect) {
      if (input.difficulty === 'medium') baseline += 8;
      if (input.difficulty === 'hard') baseline += 14;
      if (input.reasoningQuality === 'aligned') baseline += 6;
      if (input.reasoningQuality === 'flawed') baseline -= 12;
    } else {
      if (input.misconceptionDetected) baseline -= 8;
      if (input.reasoningQuality === 'partial') baseline += 6;
    }
    const clamped = clampScore(Math.round(baseline));
    return {
      newScore: clamped,
      newAttempts: 1,
      newStatus: deriveMasteryStatus(clamped, 1),
      delta: clamped - input.currentScore,
    };
  }

  let delta = 0;
  if (input.isCorrect) {
    // Diminishing gains near ceiling, boosted by harder problems and solid reasoning
    const headroomFactor = Math.max(0.35, (100 - input.currentScore) / 70);
    delta = 9 * weight * headroomFactor;
    if (input.reasoningQuality === 'aligned') {
      delta += 3;
    } else if (input.reasoningQuality === 'flawed' || input.misconceptionDetected) {
      // Lucky guess with flawed reasoning receives minimal gain
      delta = 2;
    }
  } else {
    // Penalize incorrect answers scaled inversely by difficulty (missing an easy problem hurts more)
    const basePenalty = input.difficulty === 'easy' ? -13 : input.difficulty === 'medium' ? -10 : -7;
    delta = basePenalty;
    if (input.misconceptionDetected) {
      delta -= 4;
    } else if (input.reasoningQuality === 'partial') {
      // Partial understanding softens the drop
      delta += 3;
    }
  }

  const roundedDelta = Math.round(delta);
  const newScore = clampScore(input.currentScore + roundedDelta);
  const newAttempts = input.currentAttempts + 1;

  return {
    newScore,
    newAttempts,
    newStatus: deriveMasteryStatus(newScore, newAttempts),
    delta: newScore - input.currentScore,
  };
}

export function clampScore(value: number): number {
  return Math.max(5, Math.min(99, Math.round(value)));
}

export function computeOverallMastery(scores: Array<{ masteryScore: number; attemptCount: number }>): number {
  if (scores.length === 0) return 0;
  const practiced = scores.filter((s) => s.attemptCount > 0);
  if (practiced.length === 0) return 0;
  const sum = practiced.reduce((acc, s) => acc + s.masteryScore, 0);
  return Math.round(sum / practiced.length);
}
