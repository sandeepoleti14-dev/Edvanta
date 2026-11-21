import {
  AchievementBadge,
  AchievementsPayload,
  AttemptHistoryItem,
  AuthUser,
  ConceptNode,
  Difficulty,
  FlashcardConfidence,
  FlashcardItem,
  FlashcardsPayload,
  GamificationSummary,
  LearnerConceptMastery,
  LearningModuleItem,
  MasteryStatus,
  MisconceptionRecord,
  MockExamHistoryItem,
  MockExamResultPayload,
  RevisionTask,
  StudentDashboardPayload,
  StudentJourneyPayload,
} from '../../shared/types';
import { db, initializeStudentMasteryRows } from '../db/database';
import { computeOverallMastery } from './learnerModel';
import { resolveRevisionStatus } from './revisionScheduler';
import { computeUpdatedStreak, evaluateAchievements } from './achievementsEngine';
import { DSA_MODULES } from '../curriculum/modules';
import { DSA_STUDY_PAGES } from '../curriculum/studyPages';
import { DSA_FLASHCARDS } from '../curriculum/flashcards';
import { buildStudyJourney, summarizeFlashcardDeck } from './edurevStudyEngine';
import {
  buildLearningQuests,
  buildWeeklyActivityCalendar,
  computeActivityXp,
  computeCompanionTier,
  computeLearnerLevel,
} from '../../src/utils/gamificationLogic';

export function getConceptGraphNodes(): ConceptNode[] {
  const concepts = db
    .prepare(
      `SELECT id, slug, name, description, key_formula, order_index, graph_x, graph_y
       FROM concepts ORDER BY order_index ASC`
    )
    .all() as Array<{
    id: number;
    slug: string;
    name: string;
    description: string;
    key_formula: string;
    order_index: number;
    graph_x: number;
    graph_y: number;
  }>;

  const prereqRows = db
    .prepare(`SELECT concept_id, prerequisite_id FROM concept_prerequisites`)
    .all() as Array<{ concept_id: number; prerequisite_id: number }>;

  const prereqMap = new Map<number, number[]>();
  for (const row of prereqRows) {
    const arr = prereqMap.get(row.concept_id) ?? [];
    arr.push(row.prerequisite_id);
    prereqMap.set(row.concept_id, arr);
  }

  return concepts.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    keyFormula: c.key_formula,
    orderIndex: c.order_index,
    graphX: c.graph_x,
    graphY: c.graph_y,
    prerequisites: prereqMap.get(c.id) ?? [],
  }));
}

export function getStudentConceptMasteries(studentId: number): LearnerConceptMastery[] {
  initializeStudentMasteryRows(studentId);
  const nodes = getConceptGraphNodes();

  const rows = db
    .prepare(
      `SELECT concept_id, mastery_score, status, attempt_count, correct_count, last_practiced_at
       FROM learner_mastery WHERE student_id = ?`
    )
    .all(studentId) as Array<{
    concept_id: number;
    mastery_score: number;
    status: MasteryStatus;
    attempt_count: number;
    correct_count: number;
    last_practiced_at: string | null;
  }>;

  const rowMap = new Map(rows.map((r) => [r.concept_id, r]));

  return nodes.map((node) => {
    const m = rowMap.get(node.id);
    return {
      ...node,
      masteryScore: m ? Math.round(m.mastery_score) : 0,
      status: m ? m.status : 'not_started',
      attemptCount: m ? m.attempt_count : 0,
      correctCount: m ? m.correct_count : 0,
      lastPracticedAt: m ? m.last_practiced_at : null,
    };
  });
}

export function getStudentRevisions(studentId: number): RevisionTask[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.student_id, r.concept_id, c.name as concept_name, c.slug as concept_slug,
              COALESCE(lm.mastery_score, 0) as mastery_score,
              r.scheduled_for, r.interval_days, r.repetition_count, r.reason, r.completed_at
       FROM revision_schedules r
       JOIN concepts c ON c.id = r.concept_id
       LEFT JOIN learner_mastery lm ON lm.student_id = r.student_id AND lm.concept_id = r.concept_id
       WHERE r.student_id = ?
       ORDER BY (r.completed_at IS NOT NULL) ASC, r.scheduled_for ASC`
    )
    .all(studentId) as Array<{
    id: number;
    student_id: number;
    concept_id: number;
    concept_name: string;
    concept_slug: string;
    mastery_score: number;
    scheduled_for: string;
    interval_days: number;
    repetition_count: number;
    reason: string;
    completed_at: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    conceptSlug: r.concept_slug,
    masteryScore: Math.round(r.mastery_score),
    status: resolveRevisionStatus(r.scheduled_for, r.completed_at),
    scheduledFor: r.scheduled_for,
    intervalDays: r.interval_days,
    repetitionCount: r.repetition_count,
    reason: r.reason,
    completedAt: r.completed_at,
  }));
}

export function getStudentMisconceptions(studentId: number, limit = 20): MisconceptionRecord[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.student_id, m.concept_id, c.name as concept_name, m.question_id,
              q.question_text, m.student_reasoning, m.misconception_title,
              m.conceptual_error, m.corrective_explanation, m.confidence_status,
              m.resolved, m.created_at
       FROM misconceptions m
       JOIN concepts c ON c.id = m.concept_id
       LEFT JOIN questions q ON q.id = m.question_id
       WHERE m.student_id = ?
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT ?`
    )
    .all(studentId, limit) as Array<{
    id: number;
    student_id: number;
    concept_id: number;
    concept_name: string;
    question_id: number;
    question_text: string | null;
    student_reasoning: string;
    misconception_title: string;
    conceptual_error: string;
    corrective_explanation: string;
    confidence_status: 'identified' | 'uncertain' | 'none';
    resolved: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    studentId: r.student_id,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    questionId: r.question_id,
    questionText: r.question_text ?? undefined,
    studentReasoning: r.student_reasoning,
    misconceptionTitle: r.misconception_title,
    conceptualError: r.conceptual_error,
    correctiveExplanation: r.corrective_explanation,
    confidenceStatus: r.confidence_status,
    resolved: Boolean(r.resolved),
    createdAt: r.created_at,
  }));
}

export function getStudentRecentAttempts(studentId: number, limit = 25): AttemptHistoryItem[] {
  const rows = db
    .prepare(
      `SELECT sa.id, sa.question_id, q.question_text, sa.concept_id, c.name as concept_name,
              q.difficulty, sa.selected_index, q.correct_index, q.options_json, sa.is_correct,
              sa.student_reasoning, sa.mastery_before, sa.mastery_after,
              sa.misconception_title, sa.corrective_explanation, sa.created_at
       FROM student_answers sa
       JOIN questions q ON q.id = sa.question_id
       JOIN concepts c ON c.id = sa.concept_id
       WHERE sa.student_id = ?
       ORDER BY sa.created_at DESC, sa.id DESC
       LIMIT ?`
    )
    .all(studentId, limit) as Array<{
    id: number;
    question_id: number;
    question_text: string;
    concept_id: number;
    concept_name: string;
    difficulty: Difficulty;
    selected_index: number;
    correct_index: number;
    options_json: string;
    is_correct: number;
    student_reasoning: string;
    mastery_before: number;
    mastery_after: number;
    misconception_title: string | null;
    corrective_explanation: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    questionId: r.question_id,
    questionText: r.question_text,
    conceptId: r.concept_id,
    conceptName: r.concept_name,
    difficulty: r.difficulty,
    selectedIndex: r.selected_index,
    correctIndex: r.correct_index,
    options: JSON.parse(r.options_json) as string[],
    isCorrect: Boolean(r.is_correct),
    studentReasoning: r.student_reasoning,
    masteryBefore: Math.round(r.mastery_before),
    masteryAfter: Math.round(r.mastery_after),
    misconceptionTitle: r.misconception_title,
    correctiveExplanation: r.corrective_explanation,
    createdAt: r.created_at,
  }));
}

export function buildStudentDashboard(user: AuthUser): StudentDashboardPayload {
  const conceptMasteries = getStudentConceptMasteries(user.id);
  const overallMastery = computeOverallMastery(conceptMasteries);

  const statsRow = db
    .prepare(
      `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
       FROM student_answers WHERE student_id = ?`
    )
    .get(user.id) as { total_attempted: number; total_correct: number };

  const totalAttempted = statsRow.total_attempted;
  const accuracyRate = totalAttempted > 0 ? Math.round((statsRow.total_correct / totalAttempted) * 100) : 0;

  const diagRow = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM assessment_attempts
       WHERE student_id = ? AND attempt_type = 'diagnostic' AND completed_at IS NOT NULL`
    )
    .get(user.id) as { cnt: number };
  const hasCompletedDiagnostic = diagRow.cnt > 0;

  const practiced = conceptMasteries.filter((c) => c.attemptCount > 0);
  const strongestConcepts = [...practiced]
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 3);
  const weakestConcepts = [...practiced]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  const upcomingRevisions = getStudentRevisions(user.id).filter((r) => r.status !== 'completed');
  const recentMisconceptions = getStudentMisconceptions(user.id, 6);
  const recentAttempts = getStudentRecentAttempts(user.id, 10);

  // Build progress history grouped by calendar day from stored answers
  const historyRows = db
    .prepare(
      `SELECT substr(created_at, 1, 10) as day,
              COUNT(*) as attempts,
              SUM(is_correct) as correct_cnt,
              AVG(mastery_after) as avg_mastery
       FROM student_answers
       WHERE student_id = ?
       GROUP BY substr(created_at, 1, 10)
       ORDER BY day ASC
       LIMIT 14`
    )
    .all(user.id) as Array<{
    day: string;
    attempts: number;
    correct_cnt: number;
    avg_mastery: number;
  }>;

  const progressHistory = historyRows.map((h) => ({
    date: h.day,
    accuracy: h.attempts > 0 ? Math.round((h.correct_cnt / h.attempts) * 100) : 0,
    avgMastery: Math.round(h.avg_mastery),
    attempts: h.attempts,
  }));

  // Determine recommended next activity from real state
  const dueRevision = upcomingRevisions.find((r) => r.status === 'due');
  let recommendedActivity: StudentDashboardPayload['recommendedActivity'];

  if (!hasCompletedDiagnostic) {
    recommendedActivity = {
      type: 'diagnostic',
      title: 'Start Java DSA Diagnostic',
      description: 'Complete 8 baseline questions so EDVANTA can map your strengths and pinpoint conceptual gaps.',
      targetPath: '/student/diagnostic',
    };
  } else if (dueRevision) {
    recommendedActivity = {
      type: 'revision',
      title: `Due Revision: ${dueRevision.conceptName}`,
      description: dueRevision.reason,
      conceptId: dueRevision.conceptId,
      conceptName: dueRevision.conceptName,
      targetPath: '/student/revisions',
    };
  } else if (weakestConcepts.length > 0 && weakestConcepts[0].masteryScore < 75) {
    const target = weakestConcepts[0];
    recommendedActivity = {
      type: 'practice',
      title: `Targeted Practice: ${target.name}`,
      description: `Current mastery is ${target.masteryScore}%. Adaptive questions will reinforce core principles.`,
      conceptId: target.id,
      conceptName: target.name,
      targetPath: `/student/practice?conceptId=${target.id}`,
    };
  } else {
    recommendedActivity = {
      type: 'practice',
      title: 'Advance to High-Difficulty Mastery Drill',
      description: 'Challenge your Java DSA mastery with multi-step algorithm problems.',
      targetPath: '/student/practice',
    };
  }

  const achievementsEval = buildAchievementsEvaluation(user.id, true);
  const gamification = getStudentGamificationSummary(user.id, achievementsEval.totalXp, achievementsEval.streakDays);

  return {
    user,
    hasCompletedDiagnostic,
    overallMastery,
    totalAttempted,
    accuracyRate,
    strongestConcepts,
    weakestConcepts,
    conceptMasteries,
    upcomingRevisions,
    recentMisconceptions,
    recentAttempts,
    recommendedActivity,
    progressHistory,
    gamification,
  };
}

function buildAchievementsEvaluation(studentId: number, persistNewUnlocks: boolean): AchievementsPayload & {
  newlyUnlocked: AchievementBadge[];
} {
  const userRow = db
    .prepare(`SELECT streak_days FROM users WHERE id = ?`)
    .get(studentId) as { streak_days: number } | undefined;

  const streakDays = userRow?.streak_days ?? 1;

  const diagCount = (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM assessment_attempts WHERE student_id = ? AND attempt_type = 'diagnostic' AND completed_at IS NOT NULL`
      )
      .get(studentId) as { cnt: number }
  ).cnt;

  const resolvedMisconceptionsCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM misconceptions WHERE student_id = ? AND resolved = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const completedModulesCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM student_module_progress WHERE student_id = ? AND completed = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const unlockedRows = db
    .prepare(`SELECT badge_id, unlocked_at FROM student_achievements WHERE student_id = ?`)
    .all(studentId) as Array<{ badge_id: string; unlocked_at: string }>;

  const unlockedMap = new Map(unlockedRows.map((r) => [r.badge_id, r.unlocked_at]));
  const conceptMasteries = getStudentConceptMasteries(studentId);

  const evaluated = evaluateAchievements({
    streakDays,
    diagnosticCount: diagCount,
    conceptMasteries,
    resolvedMisconceptionsCount,
    completedModulesCount,
    unlockedMap,
  });

  const nowIso = new Date().toISOString();
  if (persistNewUnlocks && evaluated.newlyUnlocked.length > 0) {
    const insertBadge = db.prepare(`
      INSERT OR IGNORE INTO student_achievements (student_id, badge_id, unlocked_at)
      VALUES (?, ?, ?)
    `);
    for (const badge of evaluated.newlyUnlocked) {
      insertBadge.run(studentId, badge.id, nowIso);
      badge.unlockedAt = nowIso;
    }
  }

  const badges = evaluated.badges.map((b) =>
    b.unlocked && !b.unlockedAt ? { ...b, unlockedAt: nowIso } : b
  );

  return {
    streakDays,
    totalXp: evaluated.totalXp,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    totalCount: badges.length,
    badges,
    newlyUnlocked: evaluated.newlyUnlocked,
  };
}

export function getStudentGamificationSummary(
  studentId: number,
  badgeXp?: number,
  streakDaysOverride?: number
): GamificationSummary {
  const userRow = db
    .prepare(`SELECT streak_days, longest_streak_days FROM users WHERE id = ?`)
    .get(studentId) as { streak_days: number; longest_streak_days: number | null } | undefined;

  const streakDays = streakDaysOverride ?? userRow?.streak_days ?? 1;
  const longestStreakDays = Math.max(streakDays, userRow?.longest_streak_days ?? 1);

  const ansStats = db
    .prepare(
      `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
       FROM student_answers WHERE student_id = ?`
    )
    .get(studentId) as { total_attempted: number; total_correct: number };

  const completedModulesCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM student_module_progress WHERE student_id = ? AND completed = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const knownFlashcardsCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM student_flashcard_progress WHERE student_id = ? AND confidence = 'known'`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const completedMockExamsCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM mock_exam_attempts WHERE student_id = ?`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const masteredCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM learner_mastery WHERE student_id = ? AND status = 'mastered'`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const resolvedMisconceptionsCount = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM misconceptions WHERE student_id = ? AND resolved = 1`)
      .get(studentId) as { cnt: number }
  ).cnt;

  const effectiveBadgeXp =
    typeof badgeXp === 'number' ? badgeXp : buildAchievementsEvaluation(studentId, false).totalXp;

  const totalXp = computeActivityXp({
    badgeXp: effectiveBadgeXp,
    totalAttempted: ansStats.total_attempted,
    correctAttempts: ansStats.total_correct,
    completedModulesCount,
    knownFlashcardsCount,
    completedMockExamsCount,
  });

  const levelInfo = computeLearnerLevel(totalXp);
  const companionTier = computeCompanionTier(levelInfo.level);

  const activityCountsByDate: Record<string, number> = {};
  const addDayRows = (rows: Array<{ day: string | null; cnt: number }>) => {
    for (const r of rows) {
      if (!r.day) continue;
      activityCountsByDate[r.day] = (activityCountsByDate[r.day] ?? 0) + r.cnt;
    }
  };

  addDayRows(
    db
      .prepare(
        `SELECT substr(created_at, 1, 10) as day, COUNT(*) as cnt
         FROM student_answers WHERE student_id = ? GROUP BY substr(created_at, 1, 10)`
      )
      .all(studentId) as Array<{ day: string | null; cnt: number }>
  );
  addDayRows(
    db
      .prepare(
        `SELECT substr(completed_at, 1, 10) as day, COUNT(*) as cnt
         FROM student_module_progress WHERE student_id = ? AND completed = 1 AND completed_at IS NOT NULL
         GROUP BY substr(completed_at, 1, 10)`
      )
      .all(studentId) as Array<{ day: string | null; cnt: number }>
  );
  addDayRows(
    db
      .prepare(
        `SELECT substr(last_reviewed_at, 1, 10) as day, COUNT(*) as cnt
         FROM student_flashcard_progress WHERE student_id = ? AND last_reviewed_at IS NOT NULL
         GROUP BY substr(last_reviewed_at, 1, 10)`
      )
      .all(studentId) as Array<{ day: string | null; cnt: number }>
  );
  addDayRows(
    db
      .prepare(
        `SELECT substr(created_at, 1, 10) as day, COUNT(*) as cnt
         FROM mock_exam_attempts WHERE student_id = ? GROUP BY substr(created_at, 1, 10)`
      )
      .all(studentId) as Array<{ day: string | null; cnt: number }>
  );

  const nowIso = new Date().toISOString();
  const todayKey = nowIso.slice(0, 10);
  const weeklyActivity = buildWeeklyActivityCalendar({
    activityCountsByDate,
    referenceDateIso: nowIso,
  });

  const dailyGoalTarget = 5;
  const dailyGoalCompleted = activityCountsByDate[todayKey] ?? 0;

  const quests = buildLearningQuests({
    todayActions: dailyGoalCompleted,
    dailyGoalTarget,
    completedModulesCount,
    knownFlashcardsCount,
    masteredCount,
    resolvedMisconceptionsCount,
  });

  return {
    level: levelInfo.level,
    levelTitle: levelInfo.levelTitle,
    totalXp: levelInfo.totalXp,
    xpInLevel: levelInfo.xpInLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    xpRemaining: levelInfo.xpRemaining,
    progressPercent: levelInfo.progressPercent,
    streakDays,
    longestStreakDays,
    dailyGoalTarget,
    dailyGoalCompleted,
    weeklyActivity,
    companionTier,
    quests,
  };
}

export function getStudentAchievements(studentId: number): AchievementsPayload {
  const { streakDays, totalXp, unlockedCount, totalCount, badges } = buildAchievementsEvaluation(
    studentId,
    true
  );
  const gamification = getStudentGamificationSummary(studentId, totalXp, streakDays);
  return { streakDays, totalXp, unlockedCount, totalCount, badges, gamification };
}

export function syncStudentStreakAndAchievements(studentId: number): {
  streakDays: number;
  newlyUnlocked: AchievementBadge[];
  achievements: AchievementsPayload;
} {
  const userRow = db
    .prepare(`SELECT streak_days, longest_streak_days, last_activity_date FROM users WHERE id = ?`)
    .get(studentId) as
    | { streak_days: number; longest_streak_days: number | null; last_activity_date: string | null }
    | undefined;

  const { newStreak, activityDateKey } = computeUpdatedStreak({
    currentStreak: userRow?.streak_days ?? 0,
    lastActivityDate: userRow?.last_activity_date ?? null,
  });
  const nextLongest = Math.max(userRow?.longest_streak_days ?? 1, newStreak);

  const nowIso = new Date().toISOString();
  db.prepare(
    `UPDATE users SET streak_days = ?, longest_streak_days = ?, last_activity_date = ?, last_active_at = ? WHERE id = ?`
  ).run(newStreak, nextLongest, activityDateKey, nowIso, studentId);

  const evaluated = buildAchievementsEvaluation(studentId, true);
  const gamification = getStudentGamificationSummary(studentId, evaluated.totalXp, newStreak);
  return {
    streakDays: newStreak,
    newlyUnlocked: evaluated.newlyUnlocked,
    achievements: {
      streakDays: newStreak,
      totalXp: evaluated.totalXp,
      unlockedCount: evaluated.unlockedCount,
      totalCount: evaluated.totalCount,
      badges: evaluated.badges,
      gamification,
    },
  };
}

export function getStudentModules(studentId: number): LearningModuleItem[] {
  const masteries = getStudentConceptMasteries(studentId);
  const masteryBySlug = new Map(masteries.map((m) => [m.slug, m]));

  const progressRows = db
    .prepare(`SELECT concept_id, completed, completed_at FROM student_module_progress WHERE student_id = ?`)
    .all(studentId) as Array<{ concept_id: number; completed: number; completed_at: string | null }>;
  const progressMap = new Map(progressRows.map((p) => [p.concept_id, p]));

  return DSA_MODULES.map((mod) => {
    const concept = masteryBySlug.get(mod.conceptSlug);
    const conceptId = concept?.id ?? mod.orderIndex;
    const prog = progressMap.get(conceptId);

    return {
      conceptId,
      conceptSlug: mod.conceptSlug,
      orderIndex: mod.orderIndex,
      title: mod.title,
      subtitle: mod.subtitle,
      estimatedMinutes: mod.estimatedMinutes,
      keyFormula: concept?.keyFormula ?? '',
      unitsNote: mod.unitsNote,
      objectives: mod.objectives,
      coreExplanation: mod.coreExplanation,
      studyPages: DSA_STUDY_PAGES[mod.conceptSlug] ?? [],
      workedExample: mod.workedExample,
      misconceptionWatch: mod.misconceptionWatch,
      simulatorType: mod.simulatorType,
      quickCheck: mod.quickCheck,
      completed: Boolean(prog?.completed),
      completedAt: prog?.completed_at ?? null,
      masteryScore: concept?.masteryScore ?? 0,
      masteryStatus: concept?.status ?? 'not_started',
    };
  });
}

export function completeStudentModule(
  studentId: number,
  conceptId: number,
  quickCheckCorrect: boolean
): {
  modules: LearningModuleItem[];
  achievements: AchievementsPayload;
  newlyUnlockedBadges: AchievementBadge[];
  streakDays: number;
} {
  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT INTO student_module_progress (student_id, concept_id, completed, quick_check_correct, completed_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(student_id, concept_id) DO UPDATE SET
       completed = 1,
       quick_check_correct = MAX(student_module_progress.quick_check_correct, excluded.quick_check_correct),
       completed_at = COALESCE(student_module_progress.completed_at, excluded.completed_at)`
  ).run(studentId, conceptId, quickCheckCorrect ? 1 : 0, nowIso);

  const synced = syncStudentStreakAndAchievements(studentId);
  const modules = getStudentModules(studentId);

  return {
    modules,
    achievements: synced.achievements,
    newlyUnlockedBadges: synced.newlyUnlocked,
    streakDays: synced.streakDays,
  };
}

export function getStudentFlashcards(studentId: number): FlashcardsPayload {
  const concepts = getConceptGraphNodes();
  const bySlug = new Map(concepts.map((c) => [c.slug, c]));

  const progressRows = db
    .prepare(
      `SELECT card_id, confidence, review_count, last_reviewed_at
       FROM student_flashcard_progress WHERE student_id = ?`
    )
    .all(studentId) as Array<{
    card_id: string;
    confidence: FlashcardConfidence;
    review_count: number;
    last_reviewed_at: string | null;
  }>;
  const progMap = new Map(progressRows.map((p) => [p.card_id, p]));

  const cards: FlashcardItem[] = DSA_FLASHCARDS.map((seed) => {
    const concept = bySlug.get(seed.conceptSlug);
    const prog = progMap.get(seed.id);
    return {
      id: seed.id,
      conceptId: concept?.id ?? 1,
      conceptSlug: seed.conceptSlug,
      conceptName: concept?.name ?? seed.conceptSlug,
      category: seed.category,
      frontPrompt: seed.frontPrompt,
      backAnswer: seed.backAnswer,
      solutionSteps: seed.solutionSteps,
      formulaHint: seed.formulaHint,
      examTip: seed.examTip,
      confidence: prog?.confidence ?? 'new',
      reviewCount: prog?.review_count ?? 0,
      lastReviewedAt: prog?.last_reviewed_at ?? null,
    };
  });

  return {
    cards,
    stats: summarizeFlashcardDeck(cards),
  };
}

export function getStudentSeenQuestionIds(studentId: number): Set<number> {
  const rows = db
    .prepare(
      `SELECT question_id FROM student_question_exposures WHERE student_id = ?
       UNION
       SELECT question_id FROM student_answers WHERE student_id = ?`
    )
    .all(studentId, studentId) as Array<{ question_id: number }>;

  return new Set(rows.map((row) => row.question_id));
}

export function claimStudentQuestionExposure(studentId: number, questionId: number): boolean {
  const result = db
    .prepare('INSERT OR IGNORE INTO student_question_exposures (student_id, question_id) VALUES (?, ?)')
    .run(studentId, questionId);
  return result.changes === 1;
}

export function reviewStudentFlashcard(
  studentId: number,
  cardId: string,
  confidence: 'known' | 'review'
): FlashcardsPayload {
  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT INTO student_flashcard_progress (student_id, card_id, confidence, review_count, last_reviewed_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(student_id, card_id) DO UPDATE SET
       confidence = excluded.confidence,
       review_count = student_flashcard_progress.review_count + 1,
       last_reviewed_at = excluded.last_reviewed_at`
  ).run(studentId, cardId, confidence, nowIso);

  const synced = syncStudentStreakAndAchievements(studentId);
  const deck = getStudentFlashcards(studentId);
  return {
    ...deck,
    streakDays: synced.streakDays,
  };
}

export function getStudentSavedNoteConceptIds(studentId: number): number[] {
  const rows = db
    .prepare(`SELECT concept_id FROM student_saved_notes WHERE student_id = ? ORDER BY saved_at DESC`)
    .all(studentId) as Array<{ concept_id: number }>;
  return rows.map((r) => r.concept_id);
}

export function toggleStudentSavedNote(
  studentId: number,
  conceptId: number
): { saved: boolean; savedNoteConceptIds: number[] } {
  const existing = db
    .prepare(`SELECT concept_id FROM student_saved_notes WHERE student_id = ? AND concept_id = ?`)
    .get(studentId, conceptId) as { concept_id: number } | undefined;

  if (existing) {
    db.prepare(`DELETE FROM student_saved_notes WHERE student_id = ? AND concept_id = ?`).run(studentId, conceptId);
    return { saved: false, savedNoteConceptIds: getStudentSavedNoteConceptIds(studentId) };
  }

  db.prepare(`INSERT INTO student_saved_notes (student_id, concept_id, saved_at) VALUES (?, ?, ?)`).run(
    studentId,
    conceptId,
    new Date().toISOString()
  );
  return { saved: true, savedNoteConceptIds: getStudentSavedNoteConceptIds(studentId) };
}

export function getStudentJourney(studentId: number): StudentJourneyPayload {
  const modules = getStudentModules(studentId);
  const masteries = getStudentConceptMasteries(studentId);
  const flashcards = getStudentFlashcards(studentId).cards;
  const savedNoteConceptIds = getStudentSavedNoteConceptIds(studentId);

  return buildStudyJourney({
    modules,
    masteries,
    flashcards,
    savedNoteConceptIds,
  });
}

export function saveMockExamAttempt(
  studentId: number,
  result: Omit<MockExamResultPayload, 'attemptId'>
): MockExamResultPayload {
  const info = db
    .prepare(
      `INSERT INTO mock_exam_attempts (
        student_id, total_questions, correct_count, score_percent, duration_used_seconds, readiness_tier, result_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      studentId,
      result.totalQuestions,
      result.correctCount,
      result.scorePercent,
      result.durationUsedSeconds,
      result.coachAnalysis.readinessTier,
      '{}',
      result.completedAt
    );

  const attemptId = Number(info.lastInsertRowid);
  const fullPayload: MockExamResultPayload = {
    ...result,
    attemptId,
  };
  db.prepare(`UPDATE mock_exam_attempts SET result_json = ? WHERE id = ?`).run(JSON.stringify(fullPayload), attemptId);
  return fullPayload;
}

export function getMockExamHistory(studentId: number): {
  history: MockExamHistoryItem[];
  latestResult: MockExamResultPayload | null;
} {
  const rows = db
    .prepare(
      `SELECT id, total_questions, correct_count, score_percent, duration_used_seconds, readiness_tier, result_json, created_at
       FROM mock_exam_attempts
       WHERE student_id = ?
       ORDER BY id DESC
       LIMIT 12`
    )
    .all(studentId) as Array<{
    id: number;
    total_questions: number;
    correct_count: number;
    score_percent: number;
    duration_used_seconds: number;
    readiness_tier: MockExamHistoryItem['readinessTier'];
    result_json: string;
    created_at: string;
  }>;

  const history: MockExamHistoryItem[] = rows.map((r) => ({
    attemptId: r.id,
    totalQuestions: r.total_questions,
    correctCount: r.correct_count,
    scorePercent: r.score_percent,
    durationUsedSeconds: r.duration_used_seconds,
    readinessTier: r.readiness_tier,
    completedAt: r.created_at,
  }));

  let latestResult: MockExamResultPayload | null = null;
  if (rows[0]?.result_json) {
    try {
      latestResult = JSON.parse(rows[0].result_json) as MockExamResultPayload;
    } catch {
      latestResult = null;
    }
  }

  return { history, latestResult };
}

export function getMockExamResultById(studentId: number, attemptId: number): MockExamResultPayload | null {
  const row = db
    .prepare(`SELECT result_json FROM mock_exam_attempts WHERE id = ? AND student_id = ?`)
    .get(attemptId, studentId) as { result_json: string } | undefined;

  if (!row) return null;
  try {
    return JSON.parse(row.result_json) as MockExamResultPayload;
  } catch {
    return null;
  }
}


