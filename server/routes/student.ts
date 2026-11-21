import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../utils/auth';
import {
  buildStudentDashboard,
  completeStudentModule,
  getStudentAchievements,
  getStudentConceptMasteries,
  getStudentMisconceptions,
  getStudentModules,
  getStudentRecentAttempts,
  getStudentRevisions,
  syncStudentStreakAndAchievements,
} from '../services/studentDataService';
import { computeOverallMastery, computeUpdatedMastery } from '../services/learnerModel';
import { selectAdaptiveTarget } from '../services/adaptiveEngine';
import {
  analyzeStudentReasoning,
  chatWithStudyCompanion,
  generateQuestionWithGemini,
} from '../services/geminiService';
import { computeNextRevisionSchedule } from '../services/revisionScheduler';
import {
  AnswerEvaluationResult,
  DiagnosticSubmitResult,
  Difficulty,
  MasteryStatus,
  QuestionItem,
} from '../../shared/types';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const user = req.authUser!;
  const classRow = user.classId
    ? (db.prepare('SELECT name FROM classes WHERE id = ?').get(user.classId) as { name: string } | undefined)
    : undefined;
  const payload = buildStudentDashboard({
    ...user,
    className: classRow?.name ?? 'Class 10 Physics — Section A',
  });
  res.json(payload);
});

studentRouter.get('/concepts', (req: AuthenticatedRequest, res: Response) => {
  const masteries = getStudentConceptMasteries(req.authUser!.id);
  res.json({ concepts: masteries });
});

studentRouter.get('/diagnostic/questions', (_req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT q.id, q.concept_id, c.slug as concept_slug, c.name as concept_name,
              q.difficulty, q.question_text, q.options_json
       FROM questions q
       JOIN concepts c ON c.id = q.concept_id
       WHERE q.is_diagnostic = 1
       ORDER BY c.order_index ASC, q.id ASC`
    )
    .all() as Array<{
    id: number;
    concept_id: number;
    concept_slug: string;
    concept_name: string;
    difficulty: Difficulty;
    question_text: string;
    options_json: string;
  }>;

  res.json({
    questions: rows.map((r) => ({
      id: r.id,
      conceptId: r.concept_id,
      conceptSlug: r.concept_slug,
      conceptName: r.concept_name,
      difficulty: r.difficulty,
      questionText: r.question_text,
      options: JSON.parse(r.options_json) as string[],
    })),
  });
});

studentRouter.post('/diagnostic/submit', async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const { answers } = req.body as {
    answers?: Array<{ questionId: number; selectedIndex: number; reasoning?: string }>;
  };

  if (!Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: 'Please answer at least one diagnostic question before submitting.' });
    return;
  }

  for (const item of answers) {
    if (
      typeof item.questionId !== 'number' ||
      typeof item.selectedIndex !== 'number' ||
      item.selectedIndex < 0 ||
      item.selectedIndex > 3
    ) {
      res.status(400).json({ error: 'Invalid diagnostic answer submission format.' });
      return;
    }
  }

  const questionRows = db
    .prepare(
      `SELECT q.id, q.concept_id, c.slug as concept_slug, c.name as concept_name,
              q.difficulty, q.question_text, q.options_json, q.correct_index,
              q.explanation, q.expected_reasoning
       FROM questions q
       JOIN concepts c ON c.id = q.concept_id`
    )
    .all() as Array<{
    id: number;
    concept_id: number;
    concept_slug: string;
    concept_name: string;
    difficulty: Difficulty;
    question_text: string;
    options_json: string;
    correct_index: number;
    explanation: string;
    expected_reasoning: string;
  }>;

  const qMap = new Map(questionRows.map((q) => [q.id, q]));

  // Pre-evaluate reasoning (supports parallel Gemini calls if reasoning provided)
  const evaluated = await Promise.all(
    answers.map(async (item) => {
      const q = qMap.get(item.questionId);
      if (!q) return null;
      const options = JSON.parse(q.options_json) as string[];
      const isCorrect = item.selectedIndex === q.correct_index;
      const reasoningText = typeof item.reasoning === 'string' ? item.reasoning.trim() : '';

      const analysis = await analyzeStudentReasoning({
        conceptSlug: q.concept_slug,
        conceptName: q.concept_name,
        questionText: q.question_text,
        selectedOptionText: options[item.selectedIndex] ?? '',
        correctOptionText: options[q.correct_index] ?? '',
        isCorrect,
        explanation: q.explanation,
        expectedReasoning: q.expected_reasoning,
        studentReasoning: reasoningText,
      });

      return { q, item, isCorrect, reasoningText, analysis };
    })
  );

  const validItems = evaluated.filter((x): x is NonNullable<typeof x> => x !== null);
  if (validItems.length === 0) {
    res.status(400).json({ error: 'No matching diagnostic questions were found.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const correctCount = validItems.filter((v) => v.isCorrect).length;

  const attemptInfo = db
    .prepare(
      `INSERT INTO assessment_attempts (student_id, attempt_type, total_questions, correct_count, started_at, completed_at)
       VALUES (?, 'diagnostic', ?, ?, ?, ?)`
    )
    .run(studentId, validItems.length, correctCount, nowIso, nowIso);
  const attemptId = Number(attemptInfo.lastInsertRowid);

  const conceptResults: DiagnosticSubmitResult['conceptResults'] = [];

  for (const entry of validItems) {
    const existingMastery = db
      .prepare(
        `SELECT mastery_score, attempt_count, correct_count
         FROM learner_mastery WHERE student_id = ? AND concept_id = ?`
      )
      .get(studentId, entry.q.concept_id) as
      | { mastery_score: number; attempt_count: number; correct_count: number }
      | undefined;

    const currentScore = existingMastery ? existingMastery.mastery_score : 0;
    const currentAttempts = existingMastery ? existingMastery.attempt_count : 0;
    const currentCorrect = existingMastery ? existingMastery.correct_count : 0;

    const updated = computeUpdatedMastery({
      currentScore,
      currentAttempts,
      isCorrect: entry.isCorrect,
      difficulty: entry.q.difficulty,
      misconceptionDetected: entry.analysis.misconceptionDetected,
      reasoningQuality: entry.analysis.reasoningQuality,
      isDiagnostic: currentAttempts === 0,
    });

    db.prepare(
      `INSERT INTO learner_mastery (student_id, concept_id, mastery_score, status, attempt_count, correct_count, last_practiced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, concept_id) DO UPDATE SET
         mastery_score = excluded.mastery_score,
         status = excluded.status,
         attempt_count = excluded.attempt_count,
         correct_count = excluded.correct_count,
         last_practiced_at = excluded.last_practiced_at`
    ).run(
      studentId,
      entry.q.concept_id,
      updated.newScore,
      updated.newStatus,
      updated.newAttempts,
      currentCorrect + (entry.isCorrect ? 1 : 0),
      nowIso
    );

    db.prepare(
      `INSERT INTO student_answers (
        attempt_id, student_id, question_id, concept_id, selected_index, is_correct,
        student_reasoning, mastery_before, mastery_after, reasoning_quality,
        misconception_title, corrective_explanation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      attemptId,
      studentId,
      entry.q.id,
      entry.q.concept_id,
      entry.item.selectedIndex,
      entry.isCorrect ? 1 : 0,
      entry.reasoningText,
      currentScore,
      updated.newScore,
      entry.analysis.reasoningQuality,
      entry.analysis.misconceptionTitle,
      entry.analysis.correctiveExplanation,
      nowIso
    );

    if (entry.analysis.misconceptionDetected && entry.analysis.misconceptionTitle) {
      db.prepare(
        `INSERT INTO misconceptions (
          student_id, concept_id, question_id, student_reasoning, misconception_title,
          conceptual_error, corrective_explanation, confidence_status, resolved, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
      ).run(
        studentId,
        entry.q.concept_id,
        entry.q.id,
        entry.reasoningText,
        entry.analysis.misconceptionTitle,
        entry.analysis.conceptualError ?? 'Conceptual gap identified during diagnostic.',
        entry.analysis.correctiveExplanation,
        entry.analysis.confidenceStatus,
        nowIso
      );
    }

    // Create/refresh spaced repetition baseline task
    const schedule = computeNextRevisionSchedule({
      masteryScore: updated.newScore,
      isCorrect: entry.isCorrect,
      misconceptionDetected: entry.analysis.misconceptionDetected,
      previousRepetitionCount: 0,
    });

    const existingPendingRev = db
      .prepare(
        `SELECT id FROM revision_schedules
         WHERE student_id = ? AND concept_id = ? AND completed_at IS NULL
         LIMIT 1`
      )
      .get(studentId, entry.q.concept_id) as { id: number } | undefined;

    if (existingPendingRev) {
      db.prepare(
        `UPDATE revision_schedules
         SET scheduled_for = ?, interval_days = ?, reason = ?
         WHERE id = ?`
      ).run(schedule.scheduledForIso, schedule.intervalDays, schedule.reason, existingPendingRev.id);
    } else {
      db.prepare(
        `INSERT INTO revision_schedules (
          student_id, concept_id, scheduled_for, interval_days, repetition_count, reason, created_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)`
      ).run(studentId, entry.q.concept_id, schedule.scheduledForIso, schedule.intervalDays, schedule.reason, nowIso);
    }

    conceptResults.push({
      conceptId: entry.q.concept_id,
      conceptName: entry.q.concept_name,
      isCorrect: entry.isCorrect,
      masteryScore: updated.newScore,
      status: updated.newStatus,
      misconceptionTitle: entry.analysis.misconceptionTitle,
    });
  }

  const synced = syncStudentStreakAndAchievements(studentId);

  const allMasteries = getStudentConceptMasteries(studentId);
  const overallMastery = computeOverallMastery(allMasteries);
  const practiced = allMasteries.filter((m) => m.attemptCount > 0);
  const weakestConcepts = [...practiced].sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 3);
  const strongestConcepts = [...practiced].sort((a, b) => b.masteryScore - a.masteryScore).slice(0, 3);

  const result: DiagnosticSubmitResult = {
    attemptId,
    totalQuestions: validItems.length,
    correctCount,
    accuracyRate: Math.round((correctCount / validItems.length) * 100),
    overallMastery,
    conceptResults,
    weakestConcepts,
    strongestConcepts,
    newlyUnlockedBadges: synced.newlyUnlocked,
    streakDays: synced.streakDays,
  };

  res.json(result);
});

studentRouter.get('/practice/next', async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const conceptIdParam = req.query.conceptId ? Number(req.query.conceptId) : undefined;
  const generateAi = req.query.generateAi === '1';

  const masteries = getStudentConceptMasteries(studentId);

  const recentAnswers = db
    .prepare(
      `SELECT question_id, concept_id FROM student_answers
       WHERE student_id = ? ORDER BY created_at DESC, id DESC LIMIT 12`
    )
    .all(studentId) as Array<{ question_id: number; concept_id: number }>;

  const recentConceptIds = recentAnswers.map((r) => r.concept_id);
  const recentQuestionIds = new Set(recentAnswers.map((r) => r.question_id));

  const target = selectAdaptiveTarget(
    masteries,
    recentConceptIds,
    conceptIdParam && !Number.isNaN(conceptIdParam) ? conceptIdParam : undefined
  );

  // Check recent misconceptions for this concept to inform AI question generation
  const recentMiscRows = db
    .prepare(
      `SELECT misconception_title FROM misconceptions
       WHERE student_id = ? AND concept_id = ? ORDER BY created_at DESC LIMIT 3`
    )
    .all(studentId, target.concept.id) as Array<{ misconception_title: string }>;

  const existingForConcept = db
    .prepare(
      `SELECT id, concept_id, difficulty, question_text, options_json, correct_index,
              explanation, expected_reasoning, misconception_indicators_json, is_diagnostic, source
       FROM questions WHERE concept_id = ?`
    )
    .all(target.concept.id) as Array<{
    id: number;
    concept_id: number;
    difficulty: Difficulty;
    question_text: string;
    options_json: string;
    correct_index: number;
    explanation: string;
    expected_reasoning: string;
    misconception_indicators_json: string;
    is_diagnostic: number;
    source: 'seeded' | 'gemini' | 'fallback';
  }>;

  // Prefer unseen question matching target difficulty, or generate fresh with Gemini if requested or exhausted
  const unseenMatchingDifficulty = existingForConcept.filter(
    (q) => !recentQuestionIds.has(q.id) && q.difficulty === target.difficulty
  );

  let chosenRow = unseenMatchingDifficulty[0];

  if (generateAi || !chosenRow) {
    const generated = await generateQuestionWithGemini({
      conceptName: target.concept.name,
      conceptDescription: target.concept.description,
      keyFormula: target.concept.keyFormula,
      difficulty: target.difficulty,
      recentMisconceptions: recentMiscRows.map((m) => m.misconception_title),
      existingQuestions: existingForConcept.map((q) => q.question_text),
    });

    if (generated) {
      const insertInfo = db
        .prepare(
          `INSERT INTO questions (
            concept_id, difficulty, question_text, options_json, correct_index,
            explanation, expected_reasoning, misconception_indicators_json, is_diagnostic, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'gemini')`
        )
        .run(
          target.concept.id,
          target.difficulty,
          generated.questionText,
          JSON.stringify(generated.options),
          generated.correctIndex,
          generated.explanation,
          generated.expectedReasoning,
          JSON.stringify(generated.misconceptionIndicators)
        );

      chosenRow = {
        id: Number(insertInfo.lastInsertRowid),
        concept_id: target.concept.id,
        difficulty: target.difficulty,
        question_text: generated.questionText,
        options_json: JSON.stringify(generated.options),
        correct_index: generated.correctIndex,
        explanation: generated.explanation,
        expected_reasoning: generated.expectedReasoning,
        misconception_indicators_json: JSON.stringify(generated.misconceptionIndicators),
        is_diagnostic: 0,
        source: 'gemini',
      };
    }
  }

  // Deterministic fallback from existing concept bank if Gemini unavailable or not needed
  if (!chosenRow) {
    const unseenAnyDiff = existingForConcept.filter((q) => !recentQuestionIds.has(q.id));
    chosenRow =
      unseenAnyDiff[0] ??
      existingForConcept.find((q) => q.difficulty === target.difficulty) ??
      existingForConcept[0];
  }

  if (!chosenRow) {
    res.status(404).json({ error: 'No practice questions available for this concept.' });
    return;
  }

  const question: Omit<QuestionItem, 'correctIndex' | 'explanation' | 'expectedReasoning'> & {
    adaptiveReason: string;
    conceptMastery: number;
    conceptStatus: MasteryStatus;
  } = {
    id: chosenRow.id,
    conceptId: target.concept.id,
    conceptSlug: target.concept.slug,
    conceptName: target.concept.name,
    difficulty: chosenRow.difficulty,
    questionText: chosenRow.question_text,
    options: JSON.parse(chosenRow.options_json) as string[],
    misconceptionIndicators: JSON.parse(chosenRow.misconception_indicators_json) as string[],
    isDiagnostic: Boolean(chosenRow.is_diagnostic),
    source: chosenRow.source === 'gemini' ? 'gemini' : 'fallback',
    adaptiveReason: target.reason,
    conceptMastery: target.concept.masteryScore,
    conceptStatus: target.concept.status,
  };

  res.json({ question });
});

studentRouter.post('/practice/submit', async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const { questionId, selectedIndex, reasoning, revisionId } = req.body as {
    questionId?: number;
    selectedIndex?: number;
    reasoning?: string;
    revisionId?: number;
  };

  if (
    typeof questionId !== 'number' ||
    typeof selectedIndex !== 'number' ||
    selectedIndex < 0 ||
    selectedIndex > 3
  ) {
    res.status(400).json({ error: 'Please select an answer option before submitting.' });
    return;
  }

  const q = db
    .prepare(
      `SELECT q.id, q.concept_id, c.slug as concept_slug, c.name as concept_name,
              q.difficulty, q.question_text, q.options_json, q.correct_index,
              q.explanation, q.expected_reasoning
       FROM questions q
       JOIN concepts c ON c.id = q.concept_id
       WHERE q.id = ?`
    )
    .get(questionId) as
    | {
        id: number;
        concept_id: number;
        concept_slug: string;
        concept_name: string;
        difficulty: Difficulty;
        question_text: string;
        options_json: string;
        correct_index: number;
        explanation: string;
        expected_reasoning: string;
      }
    | undefined;

  if (!q) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  const options = JSON.parse(q.options_json) as string[];
  const isCorrect = selectedIndex === q.correct_index;
  const reasoningText = typeof reasoning === 'string' ? reasoning.trim() : '';

  const analysis = await analyzeStudentReasoning({
    conceptSlug: q.concept_slug,
    conceptName: q.concept_name,
    questionText: q.question_text,
    selectedOptionText: options[selectedIndex] ?? '',
    correctOptionText: options[q.correct_index] ?? '',
    isCorrect,
    explanation: q.explanation,
    expectedReasoning: q.expected_reasoning,
    studentReasoning: reasoningText,
  });

  const existingMastery = db
    .prepare(
      `SELECT mastery_score, attempt_count, correct_count
       FROM learner_mastery WHERE student_id = ? AND concept_id = ?`
    )
    .get(studentId, q.concept_id) as
    | { mastery_score: number; attempt_count: number; correct_count: number }
    | undefined;

  const currentScore = existingMastery ? existingMastery.mastery_score : 0;
  const currentAttempts = existingMastery ? existingMastery.attempt_count : 0;
  const currentCorrect = existingMastery ? existingMastery.correct_count : 0;

  const updated = computeUpdatedMastery({
    currentScore,
    currentAttempts,
    isCorrect,
    difficulty: q.difficulty,
    misconceptionDetected: analysis.misconceptionDetected,
    reasoningQuality: analysis.reasoningQuality,
    isDiagnostic: false,
  });

  const nowIso = new Date().toISOString();

  const attemptInfo = db
    .prepare(
      `INSERT INTO assessment_attempts (student_id, attempt_type, total_questions, correct_count, started_at, completed_at)
       VALUES (?, ?, 1, ?, ?, ?)`
    )
    .run(studentId, revisionId ? 'revision' : 'practice', isCorrect ? 1 : 0, nowIso, nowIso);
  const attemptId = Number(attemptInfo.lastInsertRowid);

  db.prepare(
    `INSERT INTO learner_mastery (student_id, concept_id, mastery_score, status, attempt_count, correct_count, last_practiced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(student_id, concept_id) DO UPDATE SET
       mastery_score = excluded.mastery_score,
       status = excluded.status,
       attempt_count = excluded.attempt_count,
       correct_count = excluded.correct_count,
       last_practiced_at = excluded.last_practiced_at`
  ).run(
    studentId,
    q.concept_id,
    updated.newScore,
    updated.newStatus,
    updated.newAttempts,
    currentCorrect + (isCorrect ? 1 : 0),
    nowIso
  );

  db.prepare(
    `INSERT INTO student_answers (
      attempt_id, student_id, question_id, concept_id, selected_index, is_correct,
      student_reasoning, mastery_before, mastery_after, reasoning_quality,
      misconception_title, corrective_explanation, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    attemptId,
    studentId,
    q.id,
    q.concept_id,
    selectedIndex,
    isCorrect ? 1 : 0,
    reasoningText,
    currentScore,
    updated.newScore,
    analysis.reasoningQuality,
    analysis.misconceptionTitle,
    analysis.correctiveExplanation,
    nowIso
  );

  if (analysis.misconceptionDetected && analysis.misconceptionTitle) {
    db.prepare(
      `INSERT INTO misconceptions (
        student_id, concept_id, question_id, student_reasoning, misconception_title,
        conceptual_error, corrective_explanation, confidence_status, resolved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).run(
      studentId,
      q.concept_id,
      q.id,
      reasoningText,
      analysis.misconceptionTitle,
      analysis.conceptualError ?? 'Conceptual discrepancy detected in reasoning.',
      analysis.correctiveExplanation,
      analysis.confidenceStatus,
      nowIso
    );
  } else if (isCorrect && analysis.reasoningQuality === 'aligned') {
    db.prepare(`UPDATE misconceptions SET resolved = 1 WHERE student_id = ? AND concept_id = ? AND resolved = 0`).run(
      studentId,
      q.concept_id
    );
  }

  // Handle completed revision if submitted from Revision Planner
  let prevReps = 0;
  if (typeof revisionId === 'number') {
    const revRow = db
      .prepare(`SELECT id, repetition_count FROM revision_schedules WHERE id = ? AND student_id = ?`)
      .get(revisionId, studentId) as { id: number; repetition_count: number } | undefined;
    if (revRow) {
      prevReps = revRow.repetition_count + 1;
      db.prepare(`UPDATE revision_schedules SET completed_at = ? WHERE id = ?`).run(nowIso, revRow.id);
    }
  } else {
    const revCountRow = db
      .prepare(
        `SELECT COALESCE(MAX(repetition_count), 0) as reps FROM revision_schedules WHERE student_id = ? AND concept_id = ?`
      )
      .get(studentId, q.concept_id) as { reps: number };
    prevReps = revCountRow.reps + (isCorrect ? 1 : 0);
  }

  const nextSchedule = computeNextRevisionSchedule({
    masteryScore: updated.newScore,
    isCorrect,
    misconceptionDetected: analysis.misconceptionDetected,
    previousRepetitionCount: prevReps,
  });

  // Update existing pending revision for this concept or insert a fresh one
  const pendingRev = db
    .prepare(
      `SELECT id FROM revision_schedules WHERE student_id = ? AND concept_id = ? AND completed_at IS NULL LIMIT 1`
    )
    .get(studentId, q.concept_id) as { id: number } | undefined;

  let scheduledRevId: number;
  if (pendingRev) {
    db.prepare(
      `UPDATE revision_schedules
       SET scheduled_for = ?, interval_days = ?, repetition_count = ?, reason = ?
       WHERE id = ?`
    ).run(nextSchedule.scheduledForIso, nextSchedule.intervalDays, prevReps, nextSchedule.reason, pendingRev.id);
    scheduledRevId = pendingRev.id;
  } else {
    const revInsert = db
      .prepare(
        `INSERT INTO revision_schedules (
          student_id, concept_id, scheduled_for, interval_days, repetition_count, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        studentId,
        q.concept_id,
        nextSchedule.scheduledForIso,
        nextSchedule.intervalDays,
        prevReps,
        nextSchedule.reason,
        nowIso
      );
    scheduledRevId = Number(revInsert.lastInsertRowid);
  }

  const synced = syncStudentStreakAndAchievements(studentId);

  const updatedMasteries = getStudentConceptMasteries(studentId);
  const nextTarget = selectAdaptiveTarget(updatedMasteries, [q.concept_id]);

  const responsePayload: AnswerEvaluationResult = {
    attemptId,
    isCorrect,
    correctIndex: q.correct_index,
    explanation: q.explanation,
    expectedReasoning: q.expected_reasoning,
    masteryBefore: Math.round(currentScore),
    masteryAfter: updated.newScore,
    newStatus: updated.newStatus,
    analysis,
    scheduledRevision: {
      id: scheduledRevId,
      studentId,
      conceptId: q.concept_id,
      conceptName: q.concept_name,
      conceptSlug: q.concept_slug,
      masteryScore: updated.newScore,
      status: nextSchedule.status,
      scheduledFor: nextSchedule.scheduledForIso,
      intervalDays: nextSchedule.intervalDays,
      repetitionCount: prevReps,
      reason: nextSchedule.reason,
      completedAt: null,
    },
    recommendedNextConcept: {
      conceptId: nextTarget.concept.id,
      conceptName: nextTarget.concept.name,
      reason: nextTarget.reason,
    },
    newlyUnlockedBadges: synced.newlyUnlocked,
    streakDays: synced.streakDays,
  };

  res.json(responsePayload);
});

studentRouter.get('/revisions', (req: AuthenticatedRequest, res: Response) => {
  const revisions = getStudentRevisions(req.authUser!.id);
  res.json({ revisions });
});

studentRouter.post('/revisions/:id/complete', (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const revId = Number(req.params.id);
  if (Number.isNaN(revId)) {
    res.status(400).json({ error: 'Invalid revision ID.' });
    return;
  }

  const row = db
    .prepare(
      `SELECT r.id, r.concept_id, r.repetition_count, COALESCE(lm.mastery_score, 50) as mastery_score
       FROM revision_schedules r
       LEFT JOIN learner_mastery lm ON lm.student_id = r.student_id AND lm.concept_id = r.concept_id
       WHERE r.id = ? AND r.student_id = ?`
    )
    .get(revId, studentId) as
    | { id: number; concept_id: number; repetition_count: number; mastery_score: number }
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Revision task not found.' });
    return;
  }

  const nowIso = new Date().toISOString();
  db.prepare(`UPDATE revision_schedules SET completed_at = ? WHERE id = ?`).run(nowIso, row.id);

  // Schedule next spaced repetition interval
  const next = computeNextRevisionSchedule({
    masteryScore: row.mastery_score,
    isCorrect: true,
    misconceptionDetected: false,
    previousRepetitionCount: row.repetition_count + 1,
  });

  db.prepare(
    `INSERT INTO revision_schedules (
      student_id, concept_id, scheduled_for, interval_days, repetition_count, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(studentId, row.concept_id, next.scheduledForIso, next.intervalDays, row.repetition_count + 1, next.reason, nowIso);

  const synced = syncStudentStreakAndAchievements(studentId);
  const revisions = getStudentRevisions(studentId);
  res.json({
    revisions,
    newlyUnlockedBadges: synced.newlyUnlocked,
    streakDays: synced.streakDays,
  });
});

studentRouter.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const conceptMasteries = getStudentConceptMasteries(studentId);
  const recentAttempts = getStudentRecentAttempts(studentId, 30);
  const misconceptions = getStudentMisconceptions(studentId, 20);
  const revisions = getStudentRevisions(studentId);

  const difficultyBreakdown = db
    .prepare(
      `SELECT q.difficulty, COUNT(*) as attempts, SUM(sa.is_correct) as correct
       FROM student_answers sa
       JOIN questions q ON q.id = sa.question_id
       WHERE sa.student_id = ?
       GROUP BY q.difficulty`
    )
    .all(studentId) as Array<{ difficulty: Difficulty; attempts: number; correct: number }>;

  res.json({
    conceptMasteries,
    recentAttempts,
    misconceptions,
    revisions,
    difficultyBreakdown: difficultyBreakdown.map((d) => ({
      difficulty: d.difficulty,
      attempts: d.attempts,
      correct: d.correct,
      accuracy: d.attempts > 0 ? Math.round((d.correct / d.attempts) * 100) : 0,
    })),
  });
});

studentRouter.patch('/profile', (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const { name, gradeLevel } = req.body as { name?: string; gradeLevel?: string };

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanGrade = typeof gradeLevel === 'string' ? gradeLevel.trim() : '';

  if (cleanName.length < 2 || cleanName.length > 80) {
    res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    return;
  }

  db.prepare(`UPDATE users SET name = ?, grade_level = ? WHERE id = ?`).run(
    cleanName,
    cleanGrade || 'Class 10',
    studentId
  );

  res.json({
    user: {
      ...req.authUser!,
      name: cleanName,
      gradeLevel: cleanGrade || 'Class 10',
    },
  });
});

studentRouter.get('/achievements', (req: AuthenticatedRequest, res: Response) => {
  const payload = getStudentAchievements(req.authUser!.id);
  res.json(payload);
});

studentRouter.get('/modules', (req: AuthenticatedRequest, res: Response) => {
  const modules = getStudentModules(req.authUser!.id);
  res.json({ modules });
});

studentRouter.post('/modules/:conceptId/complete', (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.authUser!.id;
  const conceptId = Number(req.params.conceptId);
  if (!Number.isInteger(conceptId) || conceptId <= 0) {
    res.status(400).json({ error: 'Invalid concept ID.' });
    return;
  }

  const exists = db.prepare(`SELECT id FROM concepts WHERE id = ?`).get(conceptId) as { id: number } | undefined;
  if (!exists) {
    res.status(404).json({ error: 'Learning module concept not found.' });
    return;
  }

  const { quickCheckCorrect } = (req.body || {}) as { quickCheckCorrect?: boolean };
  const result = completeStudentModule(studentId, conceptId, Boolean(quickCheckCorrect));
  res.json(result);
});

studentRouter.post('/companion/chat', async (req: AuthenticatedRequest, res: Response) => {
  const student = req.authUser!;
  const { message, currentPage, activeConceptName, history } = (req.body || {}) as {
    message?: string;
    currentPage?: string;
    activeConceptName?: string;
    history?: Array<{ sender?: string; text?: string }>;
  };

  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  if (!cleanMessage || cleanMessage.length > 600) {
    res.status(400).json({ error: 'Please enter a message between 1 and 600 characters.' });
    return;
  }

  const masteries = getStudentConceptMasteries(student.id);
  const overallMastery = computeOverallMastery(masteries);

  const statsRow = db
    .prepare(
      `SELECT COUNT(*) as total_attempted, COALESCE(SUM(is_correct), 0) as total_correct
       FROM student_answers WHERE student_id = ?`
    )
    .get(student.id) as { total_attempted: number; total_correct: number };

  const totalAttempted = statsRow.total_attempted;
  const accuracyRate =
    totalAttempted > 0 ? Math.round((statsRow.total_correct / totalAttempted) * 100) : 0;

  const achievements = getStudentAchievements(student.id);
  const modules = getStudentModules(student.id);
  const revisions = getStudentRevisions(student.id);

  const activeMisconceptions = getStudentMisconceptions(student.id, 10)
    .filter((m) => !m.resolved)
    .slice(0, 4)
    .map((m) => ({ conceptName: m.conceptName, misconceptionTitle: m.misconceptionTitle }));

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (item): item is { sender: 'user' | 'companion'; text: string } =>
            (item?.sender === 'user' || item?.sender === 'companion') &&
            typeof item?.text === 'string' &&
            item.text.trim().length > 0
        )
        .slice(-6)
    : [];

  const result = await chatWithStudyCompanion({
    studentName: student.name,
    currentPage: typeof currentPage === 'string' ? currentPage : undefined,
    activeConceptName: typeof activeConceptName === 'string' ? activeConceptName : undefined,
    streakDays: achievements.streakDays,
    overallMastery,
    totalAttempted,
    accuracyRate,
    totalXp: achievements.totalXp,
    unlockedBadgesCount: achievements.unlockedCount,
    totalBadgesCount: achievements.totalCount,
    unlockedBadgeNames: achievements.badges.filter((b) => b.unlocked).map((b) => b.title),
    nextLockedBadges: achievements.badges
      .filter((b) => !b.unlocked)
      .sort((a, b) => b.progress / b.target - a.progress / a.target)
      .slice(0, 2)
      .map((b) => ({ title: b.title, progress: b.progress, target: b.target })),
    conceptMasteries: masteries.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      masteryScore: m.masteryScore,
      status: m.status,
      keyFormula: m.keyFormula,
    })),
    completedModulesCount: modules.filter((m) => m.completed).length,
    incompleteModules: modules
      .filter((m) => !m.completed)
      .map((m) => ({ conceptId: m.conceptId, slug: m.conceptSlug, title: m.title })),
    dueRevisions: revisions
      .filter((r) => r.status === 'due')
      .map((r) => ({ conceptId: r.conceptId, conceptName: r.conceptName, reason: r.reason })),
    activeMisconceptions,
    history: safeHistory,
    message: cleanMessage,
  });

  res.json(result);
});


