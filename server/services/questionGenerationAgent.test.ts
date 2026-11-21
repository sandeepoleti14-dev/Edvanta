import test from 'node:test';
import assert from 'node:assert/strict';
import { Difficulty } from '../../shared/types';
import { GeneratedQuestionPayload, QuestionGenerationResult } from './geminiService';
import { areQuestionsNearDuplicates, generateFreshQuestion } from './questionGenerationAgent';

function generatedQuestion(questionText: string): GeneratedQuestionPayload {
  return {
    questionText,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'A focused explanation of the correct answer.',
    expectedReasoning: 'Compare the algorithmic properties in the prompt.',
    misconceptionIndicators: [],
  };
}

const requestBase = {
  conceptName: 'Binary Search',
  conceptDescription: 'Search a sorted array.',
  keyFormula: 'O(log N)',
  difficulty: 'medium' as Difficulty,
  recentMisconceptions: [],
};

test('near-duplicate detection catches paraphrases but allows a different question', () => {
  assert.equal(
    areQuestionsNearDuplicates(
      'What is the time complexity of binary search on a sorted array?',
      'What time complexity does binary search have on sorted arrays?'
    ),
    true
  );
  assert.equal(
    areQuestionsNearDuplicates(
      'What is the time complexity of binary search on a sorted array?',
      'Which invariant guarantees that lower-bound search returns the first valid index?'
    ),
    false
  );
});

test('fresh-question generation rejects repeats, provides rejected prompts, then returns a new item', async () => {
  const existing = ['What is the time complexity of binary search on a sorted array?'];
  const requestedExclusions: string[][] = [];
  const generated = [
    generatedQuestion('What time complexity does binary search have on sorted arrays?'),
    generatedQuestion('Which invariant guarantees that lower-bound search returns the first valid index?'),
  ];

  const result = await generateFreshQuestion(
    {
      ...requestBase,
      getExistingQuestions: () => existing,
    },
    async (input) => {
      requestedExclusions.push(input.existingQuestions);
      return { question: generated.shift() ?? null };
    }
  );

  assert.equal(result.question?.questionText, 'Which invariant guarantees that lower-bound search returns the first valid index?');
  assert.equal(requestedExclusions.length, 2);
  assert.ok(requestedExclusions[1].some((question) => question.includes('binary search have on sorted arrays')));
});

test('fresh-question generation returns no question after bounded duplicate retries', async () => {
  let attempts = 0;
  const result: QuestionGenerationResult = await generateFreshQuestion(
    {
      ...requestBase,
      getExistingQuestions: () => ['What is the time complexity of binary search on a sorted array?'],
    },
    async () => {
      attempts += 1;
      return { question: generatedQuestion('What time complexity does binary search have on sorted arrays?') };
    }
  );

  assert.equal(attempts, 3);
  assert.equal(result.question, null);
  assert.match(result.aiNotice ?? '', /sufficiently new question/);
});
