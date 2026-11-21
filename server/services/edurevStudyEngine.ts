import {
  Difficulty,
  FlashcardItem,
  FlashcardsPayload,
  JourneyMilestone,
  LearnerConceptMastery,
  LearningModuleItem,
  MockExamCoachAnalysis,
  MockExamConceptBreakdown,
  StudentJourneyPayload,
} from '../../shared/types';
import { pickDifficultyForMastery } from './adaptiveEngine';

export interface ExamQuestionCandidate {
  id: number;
  conceptId: number;
  conceptSlug: string;
  conceptName: string;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
}

export function filterUnseenQuestions<T extends { id: number }>(
  questions: T[],
  seenQuestionIds: Set<number>
): T[] {
  return questions.filter((question) => !seenQuestionIds.has(question.id));
}

export function summarizeFlashcardDeck(cards: FlashcardItem[]): FlashcardsPayload['stats'] {
  let known = 0;
  let needsReview = 0;
  let unreviewed = 0;

  for (const c of cards) {
    if (c.confidence === 'known') known++;
    else if (c.confidence === 'review') needsReview++;
    else unreviewed++;
  }

  return {
    total: cards.length,
    known,
    needsReview,
    unreviewed,
  };
}

export function buildStudyJourney(params: {
  modules: LearningModuleItem[];
  masteries: LearnerConceptMastery[];
  flashcards: FlashcardItem[];
  savedNoteConceptIds: number[];
}): StudentJourneyPayload {
  const masteryById = new Map(params.masteries.map((m) => [m.id, m]));
  const savedSet = new Set(params.savedNoteConceptIds);

  const cardsByConcept = new Map<number, FlashcardItem[]>();
  for (const card of params.flashcards) {
    const arr = cardsByConcept.get(card.conceptId) ?? [];
    arr.push(card);
    cardsByConcept.set(card.conceptId, arr);
  }

  const milestones: JourneyMilestone[] = params.modules
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((mod) => {
      const mastery = masteryById.get(mod.conceptId);
      const conceptCards = cardsByConcept.get(mod.conceptId) ?? [];
      const flashcardsKnown = conceptCards.filter((c) => c.confidence === 'known').length;
      const flashcardsTotal = conceptCards.length;
      const practiceAttempts = mastery?.attemptCount ?? 0;
      const masteryScore = mastery?.masteryScore ?? mod.masteryScore;
      const masteryStatus = mastery?.status ?? mod.masteryStatus;
      const noteSavedOffline = savedSet.has(mod.conceptId);

      let nextStepType: JourneyMilestone['nextStepType'] = 'complete';
      let nextStepLabel = 'Mastered · Take Mock Exam';
      let nextStepPath = '/student/mock-exam';

      if (!mod.completed) {
        nextStepType = 'learn';
        nextStepLabel = 'Read Module & Simulator';
        nextStepPath = `/student/modules?conceptSlug=${mod.conceptSlug}`;
      } else if (flashcardsTotal > 0 && flashcardsKnown < flashcardsTotal) {
        nextStepType = 'flashcards';
        nextStepLabel = `Review Flashcards (${flashcardsKnown}/${flashcardsTotal})`;
        nextStepPath = `/student/flashcards?conceptSlug=${mod.conceptSlug}`;
      } else if (masteryScore < 75 || practiceAttempts === 0) {
        nextStepType = 'practice';
        nextStepLabel = 'Drill Adaptive Practice';
        nextStepPath = `/student/practice?conceptId=${mod.conceptId}`;
      }

      return {
        conceptId: mod.conceptId,
        conceptSlug: mod.conceptSlug,
        orderIndex: mod.orderIndex,
        title: mod.title,
        subtitle: mod.subtitle,
        keyFormula: mod.keyFormula,
        estimatedMinutes: mod.estimatedMinutes,
        masteryScore,
        masteryStatus,
        moduleCompleted: mod.completed,
        flashcardsKnown,
        flashcardsTotal,
        practiceAttempts,
        noteSavedOffline,
        nextStepType,
        nextStepLabel,
        nextStepPath,
      };
    });

  // Pick first incomplete milestone in prerequisite order, prioritizing weak/incomplete items
  const upNext =
    milestones.find((m) => m.nextStepType !== 'complete') ??
    milestones[milestones.length - 1];

  const stepPointsTotal = milestones.length * 3;
  let earnedPoints = 0;
  for (const m of milestones) {
    if (m.moduleCompleted) earnedPoints += 1;
    if (m.flashcardsTotal > 0 && m.flashcardsKnown >= Math.ceil(m.flashcardsTotal / 2)) earnedPoints += 1;
    if (m.masteryScore >= 75) earnedPoints += 1;
  }
  const overallCompletionPercent =
    stepPointsTotal > 0 ? Math.min(100, Math.round((earnedPoints / stepPointsTotal) * 100)) : 0;

  return {
    milestones,
    upNext,
    savedNoteConceptIds: Array.from(savedSet),
    overallCompletionPercent,
  };
}

export function selectMockExamQuestions(
  allQuestions: ExamQuestionCandidate[],
  masteries: LearnerConceptMastery[],
  targetCount = 10
): ExamQuestionCandidate[] {
  const orderedMasteries = masteries.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const byConcept = new Map<number, ExamQuestionCandidate[]>();
  for (const q of allQuestions) {
    const arr = byConcept.get(q.conceptId) ?? [];
    arr.push(q);
    byConcept.set(q.conceptId, arr);
  }

  const chosen: ExamQuestionCandidate[] = [];
  const chosenIds = new Set<number>();

  // 1. Ensure 1 calibrated question per concept across the full Java DSA curriculum
  for (const m of orderedMasteries) {
    const pool = byConcept.get(m.id) ?? [];
    if (pool.length === 0) continue;
    const preferredDiff = pickDifficultyForMastery(m.masteryScore, m.attemptCount);
    const match =
      pool.find((q) => q.difficulty === preferredDiff && !chosenIds.has(q.id)) ??
      pool.find((q) => !chosenIds.has(q.id));
    if (match) {
      chosen.push(match);
      chosenIds.add(match.id);
    }
  }

  // 2. Fill remaining slots up to targetCount prioritizing weakest concepts with non-easy challenge
  const weakFirst = masteries.slice().sort((a, b) => a.masteryScore - b.masteryScore);
  for (const m of weakFirst) {
    if (chosen.length >= targetCount) break;
    const pool = byConcept.get(m.id) ?? [];
    const extra =
      pool.find((q) => !chosenIds.has(q.id) && q.difficulty !== 'easy') ??
      pool.find((q) => !chosenIds.has(q.id));
    if (extra) {
      chosen.push(extra);
      chosenIds.add(extra.id);
    }
  }

  // 3. Fallback if still short
  for (const q of allQuestions) {
    if (chosen.length >= targetCount) break;
    if (!chosenIds.has(q.id)) {
      chosen.push(q);
      chosenIds.add(q.id);
    }
  }

  return chosen.slice(0, targetCount);
}

export function buildMockExamCoachAnalysis(params: {
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  durationUsedSeconds: number;
  conceptBreakdown: MockExamConceptBreakdown[];
  misconceptionsDetected: string[];
}): MockExamCoachAnalysis {
  const {
    scorePercent,
    correctCount,
    unansweredCount,
    totalQuestions,
    durationUsedSeconds,
    conceptBreakdown,
    misconceptionsDetected,
  } = params;

  const avgSec = totalQuestions > 0 ? Math.round(durationUsedSeconds / totalQuestions) : 0;

  let readinessTier: MockExamCoachAnalysis['readinessTier'] = 'Needs Focused Revision';
  let headline = 'Targeted Revision Needed Before Board Exam';
  if (scorePercent >= 80) {
    readinessTier = 'Exam Ready';
    headline = 'Strong Java DSA Readiness';
  } else if (scorePercent >= 55) {
    readinessTier = 'Developing Momentum';
    headline = 'Solid Foundation — Close 2–3 Targeted Gaps for 85%+';
  }

  const strongConcepts = conceptBreakdown
    .filter((c) => c.accuracy >= 80 || c.masteryAfter >= 75)
    .sort((a, b) => b.accuracy - a.accuracy || b.masteryAfter - a.masteryAfter);

  const weakConcepts = conceptBreakdown
    .filter((c) => c.accuracy < 75 || c.masteryAfter < 65)
    .sort((a, b) => a.accuracy - b.accuracy || a.masteryAfter - b.masteryAfter);

  const strengths: string[] = [];
  if (strongConcepts.length > 0) {
    strengths.push(
      `High accuracy in ${strongConcepts
        .slice(0, 3)
        .map((c) => c.conceptName)
        .join(', ')}.`
    );
  }
  if (unansweredCount === 0) {
    strengths.push('Completed every question in the paper with zero unanswered blanks.');
  }
  if (avgSec > 0 && avgSec <= 75 && scorePercent >= 60) {
    strengths.push(`Balanced exam pacing at ${avgSec} seconds per question.`);
  }
  if (strengths.length === 0) {
    strengths.push(`Completed a full ${totalQuestions}-question syllabus simulation (${correctCount}/${totalQuestions} correct).`);
  }

  const priorityFocusConcepts = weakConcepts.slice(0, 3).map((c) => ({
    conceptId: c.conceptId,
    conceptName: c.conceptName,
    reason:
      c.accuracy === 0
        ? `0% accuracy in this mock (${c.masteryAfter}% mastery) — review formula rules and redo 2 guided numericals.`
        : `${c.accuracy}% accuracy in this mock (${c.masteryAfter}% mastery) — tighten unit checks and edge-case traps.`,
    actionLabel: `Practice ${c.conceptName}`,
    targetPath: `/student/practice?conceptId=${c.conceptId}`,
  }));

  let timeManagementNote = '';
  if (unansweredCount > 0) {
    timeManagementNote = `${unansweredCount} question(s) remained unanswered when submitted. Aim for ~60–75 seconds on MCQs and mark tricky numericals for a second pass.`;
  } else if (avgSec < 20) {
    timeManagementNote = `Very rapid pace (${avgSec}s/question). Slow down on complexity analysis and edge cases to verify your approach.`;
  } else if (avgSec <= 80) {
    timeManagementNote = `Well-paced at ${avgSec}s per question (${Math.floor(durationUsedSeconds / 60)}m ${durationUsedSeconds % 60}s total), leaving safe buffer time for final verification.`;
  } else {
    timeManagementNote = `Averaged ${avgSec}s per question. Drill formula flashcards to recall V=IR, 1/R_eq, and H=I²Rt faster under timed pressure.`;
  }

  const roadmapSteps: string[] = [];
  if (priorityFocusConcepts[0]) {
    roadmapSteps.push(
      `Revisit the ${priorityFocusConcepts[0].conceptName} lesson & simulator, then save its offline formula sheet.`
    );
  } else {
    roadmapSteps.push('Drill mixed high-difficulty numericals in Adaptive Practice to push all concepts past 85%.');
  }
  if (misconceptionsDetected.length > 0) {
    roadmapSteps.push(`Address detected reasoning trap: "${misconceptionsDetected[0]}".`);
  } else {
    roadmapSteps.push('Use the "Needs Review" flashcard queue to reinforce Java syntax and algorithm patterns.');
  }
  roadmapSteps.push('Retake a fresh Timed Mock Exam after clearing due revisions to measure score growth.');

  const formatTopicList = (names: string[]): string => {
    if (names.length <= 1) return names[0] ?? '';
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };

  const summary =
    priorityFocusConcepts.length > 0
      ? `You scored ${scorePercent}% (${correctCount}/${totalQuestions}) in ${Math.floor(
          durationUsedSeconds / 60
        )}m ${durationUsedSeconds % 60}s. Priority gains will come from strengthening ${formatTopicList(
          priorityFocusConcepts.map((p) => p.conceptName)
        )}.`
      : `Excellent execution—${scorePercent}% (${correctCount}/${totalQuestions}) across all 8 Java DSA topics. Keep periodic spaced revisions active to retain mastery.`;

  return {
    readinessTier,
    headline,
    summary,
    strengths,
    priorityFocusConcepts,
    timeManagementNote,
    roadmapSteps,
    source: 'deterministic',
  };
}
