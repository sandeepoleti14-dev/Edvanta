import test from 'node:test';
import assert from 'node:assert/strict';
import { DSA_CONCEPTS, SEED_QUESTIONS } from './dsa';

test('the seeded Java DSA question bank is valid and has fresh fallbacks for every topic', () => {
  const conceptSlugs = new Set(DSA_CONCEPTS.map((concept) => concept.slug));
  const normalizedQuestions = SEED_QUESTIONS.map((question) =>
    question.questionText.toLowerCase().replace(/\s+/g, ' ').trim()
  );

  assert.equal(new Set(normalizedQuestions).size, SEED_QUESTIONS.length, 'seeded questions should be unique');

  for (const concept of DSA_CONCEPTS) {
    const questions = SEED_QUESTIONS.filter((question) => question.conceptSlug === concept.slug);
    assert.ok(questions.length >= 3, `${concept.slug} should have several fallback questions`);
    assert.equal(
      questions.filter((question) => question.isDiagnostic).length,
      1,
      `${concept.slug} should have exactly one diagnostic question`
    );
  }

  for (const question of SEED_QUESTIONS) {
    assert.ok(conceptSlugs.has(question.conceptSlug), `${question.questionText} should map to a DSA topic`);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.toLowerCase())).size, 4);
    assert.ok(question.correctIndex >= 0 && question.correctIndex < 4);
    assert.ok(question.explanation.trim().length > 10);
    assert.ok(question.expectedReasoning.trim().length > 10);
  }
});
