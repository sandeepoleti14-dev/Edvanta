import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMockExamCoachAnalysis,
  buildStudyJourney,
  ExamQuestionCandidate,
  selectMockExamQuestions,
  summarizeFlashcardDeck,
} from './edurevStudyEngine';
import {
  FlashcardItem,
  LearnerConceptMastery,
  LearningModuleItem,
  MockExamConceptBreakdown,
} from '../../shared/types';

function makeConcept(id: number, slug: string, name: string, score: number, attempts = 2): LearnerConceptMastery {
  return {
    id,
    slug,
    name,
    description: `${name} desc`,
    keyFormula: 'V = I × R',
    orderIndex: id,
    graphX: 0,
    graphY: 0,
    prerequisites: [],
    masteryScore: score,
    status: attempts === 0 ? 'not_started' : score >= 75 ? 'mastered' : score >= 50 ? 'developing' : 'weak',
    attemptCount: attempts,
    correctCount: Math.max(0, attempts - 1),
    lastPracticedAt: null,
  };
}

function makeModule(concept: LearnerConceptMastery, completed: boolean): LearningModuleItem {
  return {
    conceptId: concept.id,
    conceptSlug: concept.slug,
    orderIndex: concept.orderIndex,
    title: `0${concept.orderIndex}. ${concept.name}`,
    subtitle: 'Subtitle',
    estimatedMinutes: 8,
    keyFormula: concept.keyFormula,
    unitsNote: 'SI units',
    objectives: ['Obj 1'],
    coreExplanation: 'Explanation',
    workedExample: { problem: 'P', steps: ['S1'], answer: 'A' },
    misconceptionWatch: 'Watch',
    simulatorType: 'ohms',
    quickCheck: { question: 'Q', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Exp' },
    completed,
    completedAt: completed ? '2026-11-20T00:00:00.000Z' : null,
    masteryScore: concept.masteryScore,
    masteryStatus: concept.status,
  };
}

function makeCard(id: string, concept: LearnerConceptMastery, confidence: FlashcardItem['confidence']): FlashcardItem {
  return {
    id,
    conceptId: concept.id,
    conceptSlug: concept.slug,
    conceptName: concept.name,
    category: 'Formula',
    frontPrompt: 'Prompt',
    backAnswer: 'Answer',
    formulaHint: 'Hint',
    examTip: 'Tip',
    confidence,
    reviewCount: confidence === 'new' ? 0 : 1,
    lastReviewedAt: null,
  };
}

test('summarizeFlashcardDeck counts known, needsReview, and unreviewed cards accurately', () => {
  const c1 = makeConcept(1, 'electric-current', 'Electric Current', 80);
  const stats = summarizeFlashcardDeck([
    makeCard('a', c1, 'known'),
    makeCard('b', c1, 'known'),
    makeCard('c', c1, 'review'),
    makeCard('d', c1, 'new'),
  ]);
  assert.deepEqual(stats, { total: 4, known: 2, needsReview: 1, unreviewed: 1 });
});

test('buildStudyJourney computes milestone nextStepType and Up Next recommendation', () => {
  const c1 = makeConcept(1, 'electric-current', 'Electric Current', 85, 3);
  const c2 = makeConcept(2, 'potential-difference', 'Potential Difference', 70, 2);
  const c3 = makeConcept(3, 'ohms-law', "Ohm's Law", 40, 2);

  const journey = buildStudyJourney({
    modules: [makeModule(c1, true), makeModule(c2, true), makeModule(c3, false)],
    masteries: [c1, c2, c3],
    flashcards: [
      makeCard('f1', c1, 'known'),
      makeCard('f2', c2, 'known'),
      makeCard('f3', c3, 'new'),
    ],
    savedNoteConceptIds: [1],
  });

  assert.equal(journey.milestones[0].nextStepType, 'complete');
  assert.equal(journey.milestones[0].noteSavedOffline, true);
  assert.equal(journey.milestones[1].nextStepType, 'practice');
  assert.equal(journey.milestones[2].nextStepType, 'learn');
  assert.equal(journey.upNext.conceptId, 2);
  assert.ok(journey.overallCompletionPercent > 40 && journey.overallCompletionPercent < 100);
});

test('selectMockExamQuestions covers syllabus and prioritizes weak concepts for extra items', () => {
  const concepts = [
    makeConcept(1, 'electric-current', 'Electric Current', 85, 4),
    makeConcept(2, 'potential-difference', 'Potential Difference', 78, 3),
    makeConcept(3, 'ohms-law', "Ohm's Law", 35, 2),
  ];

  const questions: ExamQuestionCandidate[] = [];
  let qId = 1;
  for (const c of concepts) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      questions.push({
        id: qId++,
        conceptId: c.id,
        conceptSlug: c.slug,
        conceptName: c.name,
        difficulty,
        questionText: `${c.name} ${difficulty}`,
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: 'Exp',
        expectedReasoning: 'Reason',
      });
    }
  }

  const picked = selectMockExamQuestions(questions, concepts, 5);
  assert.equal(picked.length, 5);
  const conceptIds = new Set(picked.map((q) => q.conceptId));
  assert.equal(conceptIds.size, 3);
  assert.ok(picked.filter((q) => q.conceptId === 3).length >= 2);
});

test('buildMockExamCoachAnalysis assigns readiness tier and prioritizes lowest-accuracy concepts', () => {
  const breakdown: MockExamConceptBreakdown[] = [
    {
      conceptId: 1,
      conceptName: 'Electric Current',
      conceptSlug: 'electric-current',
      totalQuestions: 2,
      correctCount: 2,
      accuracy: 100,
      masteryBefore: 70,
      masteryAfter: 82,
      status: 'mastered',
    },
    {
      conceptId: 3,
      conceptName: "Ohm's Law",
      conceptSlug: 'ohms-law',
      totalQuestions: 2,
      correctCount: 0,
      accuracy: 0,
      masteryBefore: 42,
      masteryAfter: 34,
      status: 'weak',
    },
  ];

  const analysis = buildMockExamCoachAnalysis({
    scorePercent: 50,
    correctCount: 5,
    incorrectCount: 4,
    unansweredCount: 1,
    totalQuestions: 10,
    durationUsedSeconds: 540,
    conceptBreakdown: breakdown,
    misconceptionsDetected: ['Assumes current rises with resistance'],
  });

  assert.equal(analysis.readinessTier, 'Needs Focused Revision');
  assert.equal(analysis.priorityFocusConcepts[0].conceptId, 3);
  assert.ok(analysis.timeManagementNote.includes('1 question(s) remained unanswered'));
  assert.ok(analysis.roadmapSteps.some((s) => s.includes('Assumes current rises with resistance')));
});
