import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOverallMastery, computeUpdatedMastery, deriveMasteryStatus } from './learnerModel';
import { pickDifficultyForMastery, selectAdaptiveTarget } from './adaptiveEngine';
import { computeNextRevisionSchedule, resolveRevisionStatus } from './revisionScheduler';
import { analyzeReasoningDeterministic, hasSufficientReasoning } from './misconceptionEngine';
import { computeUpdatedStreak, evaluateAchievements } from './achievementsEngine';
import {
  buildAllowedRouteSet,
  buildInteractiveFallbackResponse,
  CompanionStudentSnapshot,
  sanitizeCompanionActions,
  answerInlineDsaQuestion,
} from './companionBrain';
import { LearnerConceptMastery } from '../../shared/types';

test('deriveMasteryStatus classifies score thresholds accurately', () => {
  assert.equal(deriveMasteryStatus(0, 0), 'not_started');
  assert.equal(deriveMasteryStatus(40, 1), 'weak');
  assert.equal(deriveMasteryStatus(65, 2), 'developing');
  assert.equal(deriveMasteryStatus(75, 3), 'mastered');
  assert.equal(deriveMasteryStatus(92, 5), 'mastered');
});

test('computeUpdatedMastery rewards hard correct aligned answers and penalizes misconceptions', () => {
  const gain = computeUpdatedMastery({
    currentScore: 50,
    currentAttempts: 2,
    isCorrect: true,
    difficulty: 'hard',
    misconceptionDetected: false,
    reasoningQuality: 'aligned',
  });
  assert.ok(gain.newScore > 60);
  assert.equal(gain.newAttempts, 3);

  const drop = computeUpdatedMastery({
    currentScore: 55,
    currentAttempts: 2,
    isCorrect: false,
    difficulty: 'easy',
    misconceptionDetected: true,
    reasoningQuality: 'flawed',
  });
  assert.ok(drop.newScore < 45);
  assert.equal(drop.newStatus, 'weak');
});

test('computeOverallMastery ignores not-started concepts', () => {
  assert.equal(
    computeOverallMastery([
      { masteryScore: 80, attemptCount: 2 },
      { masteryScore: 40, attemptCount: 1 },
      { masteryScore: 0, attemptCount: 0 },
    ]),
    60
  );
  assert.equal(computeOverallMastery([{ masteryScore: 0, attemptCount: 0 }]), 0);
});

test('selectAdaptiveTarget prioritizes weak concepts over mastered concepts and adapts difficulty', () => {
  const concepts: LearnerConceptMastery[] = [
    {
      id: 1,
      slug: 'complexity-analysis',
      name: 'Time & Space Complexity',
      description: '',
      keyFormula: 'O(N log N)',
      orderIndex: 1,
      graphX: 0,
      graphY: 0,
      prerequisites: [],
      masteryScore: 88,
      status: 'mastered',
      attemptCount: 4,
      correctCount: 4,
      lastPracticedAt: null,
    },
    {
      id: 2,
      slug: 'arrays-hashing',
      name: 'Arrays & Hashing',
      description: '',
      keyFormula: 'map.get(key)',
      orderIndex: 3,
      graphX: 0,
      graphY: 0,
      prerequisites: [1],
      masteryScore: 34,
      status: 'weak',
      attemptCount: 2,
      correctCount: 0,
      lastPracticedAt: null,
    },
  ];

  const target = selectAdaptiveTarget(concepts, [1]);
  assert.equal(target.concept.slug, 'arrays-hashing');
  assert.equal(target.difficulty, 'easy');
  assert.equal(pickDifficultyForMastery(62, 2), 'medium');
  assert.equal(pickDifficultyForMastery(82, 4), 'hard');
});

test('spaced repetition schedules weak concepts sooner than mastered concepts', () => {
  const baseDate = new Date('2026-11-20T12:00:00.000Z');
  const weakSchedule = computeNextRevisionSchedule({
    masteryScore: 35,
    isCorrect: false,
    misconceptionDetected: true,
    previousRepetitionCount: 0,
    now: baseDate,
  });
  const masteredSchedule = computeNextRevisionSchedule({
    masteryScore: 86,
    isCorrect: true,
    misconceptionDetected: false,
    previousRepetitionCount: 2,
    now: baseDate,
  });

  assert.equal(weakSchedule.status, 'due');
  assert.ok(weakSchedule.intervalDays < masteredSchedule.intervalDays);
  assert.equal(masteredSchedule.status, 'upcoming');
  assert.equal(resolveRevisionStatus(weakSchedule.scheduledForIso, null, baseDate), 'due');
  assert.equal(resolveRevisionStatus(weakSchedule.scheduledForIso, baseDate.toISOString(), baseDate), 'completed');
});

test('misconception engine reports uncertain when reasoning is insufficient and detects a Big-O misconception', () => {
  assert.equal(hasSufficientReasoning('idk'), false);
  assert.equal(hasSufficientReasoning('Every nested loop is always quadratic'), true);

  const insufficient = analyzeReasoningDeterministic({
    conceptSlug: 'complexity-analysis',
    conceptName: 'Time & Space Complexity',
    questionText: 'What is the complexity of an N loop with a doubling inner index?',
    selectedOptionText: 'O(N^2)',
    correctOptionText: 'O(N log N)',
    isCorrect: false,
    explanation: 'The outer loop is N and the inner loop is log N.',
    expectedReasoning: 'Multiply the iteration counts.',
    studentReasoning: 'guess',
  });
  assert.equal(insufficient.confidenceStatus, 'uncertain');
  assert.equal(insufficient.misconceptionDetected, false);

  const identified = analyzeReasoningDeterministic({
    conceptSlug: 'complexity-analysis',
    conceptName: 'Time & Space Complexity',
    questionText: 'What is the complexity of an N loop with a doubling inner index?',
    selectedOptionText: 'O(N^2)',
    correctOptionText: 'O(N log N)',
    isCorrect: false,
    explanation: 'The outer loop is N and the inner loop is log N.',
    expectedReasoning: 'Multiply the iteration counts.',
    studentReasoning: 'Every nested loop is always quadratic',
  });
  assert.equal(identified.confidenceStatus, 'identified');
  assert.equal(identified.misconceptionDetected, true);
  assert.ok(identified.misconceptionTitle?.toLowerCase().includes('loop'));
});

test('computeUpdatedStreak handles same-day idempotency, consecutive increment, and gap reset', () => {
  const today = new Date('2026-11-21T10:00:00.000Z');

  const firstEver = computeUpdatedStreak({ currentStreak: 0, lastActivityDate: null, today });
  assert.equal(firstEver.newStreak, 1);
  assert.equal(firstEver.activityDateKey, '2026-11-21');

  const sameDay = computeUpdatedStreak({ currentStreak: 4, lastActivityDate: '2026-11-21', today });
  assert.equal(sameDay.newStreak, 4);

  const nextDay = computeUpdatedStreak({ currentStreak: 4, lastActivityDate: '2026-11-20', today });
  assert.equal(nextDay.newStreak, 5);

  const missedDays = computeUpdatedStreak({ currentStreak: 6, lastActivityDate: '2026-11-18', today });
  assert.equal(missedDays.newStreak, 1);
});

test('evaluateAchievements unlocks qualifying badges, computes newlyUnlocked diff, and sums XP', () => {
  const makeMastery = (slug: string, status: LearnerConceptMastery['status']): LearnerConceptMastery => ({
    id: 1,
    slug,
    name: slug,
    description: '',
    keyFormula: '',
    orderIndex: 1,
    graphX: 0,
    graphY: 0,
    prerequisites: [],
    masteryScore: status === 'mastered' ? 85 : 40,
    status,
    attemptCount: 2,
    correctCount: 1,
    lastPracticedAt: null,
  });

  const unlockedMap = new Map<string, string>([['first_diagnostic', '2026-11-19T10:00:00.000Z']]);
  const res = evaluateAchievements({
    streakDays: 5,
    diagnosticCount: 1,
    conceptMasteries: [
      makeMastery('complexity-analysis', 'mastered'),
      makeMastery('arrays-hashing', 'mastered'),
      makeMastery('graphs-dp', 'mastered'),
    ],
    resolvedMisconceptionsCount: 1,
    completedModulesCount: 3,
    unlockedMap,
  });

  const newlyIds = res.newlyUnlocked.map((b) => b.id);
  assert.ok(!newlyIds.includes('first_diagnostic'));
  assert.ok(newlyIds.includes('streak_3'));
  assert.ok(newlyIds.includes('streak_5'));
  assert.ok(newlyIds.includes('first_mastery'));
  assert.ok(newlyIds.includes('pattern_architect'));
  assert.ok(newlyIds.includes('misconception_buster'));
  assert.ok(newlyIds.includes('module_explorer'));
  assert.equal(res.totalXp, 100 + 150 + 250 + 150 + 300 + 200 + 150);
});

test('companionBrain answers Java DSA questions, sanitizes routes, and returns interactive app actions', () => {
  const binarySearch = answerInlineDsaQuestion('What is binary search complexity for N=1024 elements?');
  assert.ok(binarySearch);
  assert.ok(binarySearch.answerText.includes('O(log N)'));
  assert.equal(binarySearch.conceptSlug, 'binary-search-sorting');

  const twoSum = answerInlineDsaQuestion('How does a HashMap help with Two Sum?');
  assert.ok(twoSum);
  assert.ok(twoSum.answerText.includes('O(N)'));

  const snapshot: CompanionStudentSnapshot = {
    studentName: 'Aarav Sharma',
    streakDays: 5,
    overallMastery: 59,
    totalAttempted: 16,
    accuracyRate: 63,
    totalXp: 800,
    unlockedBadgesCount: 5,
    totalBadgesCount: 10,
    unlockedBadgeNames: ['Baseline Calibrated', '3-Day Momentum', 'Module Explorer'],
    nextLockedBadges: [{ title: 'Weekly Champion', progress: 5, target: 7 }],
    conceptMasteries: [
      { id: 1, slug: 'complexity-analysis', name: 'Time & Space Complexity', masteryScore: 84, status: 'mastered', keyFormula: 'O(N log N)' },
      { id: 3, slug: 'arrays-hashing', name: 'Arrays & Hashing', masteryScore: 38, status: 'weak', keyFormula: 'map.get(key)' },
    ],
    completedModulesCount: 3,
    incompleteModules: [{ conceptId: 4, slug: 'recursion-backtracking', title: '04. Recursion & Backtracking' }],
    dueRevisions: [{ conceptId: 3, conceptName: 'Arrays & Hashing', reason: 'Mastery below 50%' }],
    activeMisconceptions: [{ conceptName: 'Arrays & Hashing', misconceptionTitle: 'Misses the HashMap lookup trade-off' }],
    history: [],
    message: 'What are my badges and streak?',
  };

  const badgeReply = buildInteractiveFallbackResponse(snapshot);
  assert.ok(badgeReply.reply.includes('5-day streak'));
  assert.ok(badgeReply.reply.includes('800 XP'));
  assert.ok(badgeReply.actions.some((a) => a.targetPath === '/student/achievements'));

  const allowed = buildAllowedRouteSet(snapshot.conceptMasteries);
  const sanitized = sanitizeCompanionActions(
    [
      { label: 'Practice Arrays', targetPath: '/student/practice?conceptId=3' },
      { label: 'Injected Bad Route', targetPath: 'https://evil.example.com' },
      { label: 'Duplicate', targetPath: '/student/practice?conceptId=3' },
    ],
    allowed
  );
  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].targetPath, '/student/practice?conceptId=3');
});


