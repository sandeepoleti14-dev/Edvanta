import test from 'node:test';
import assert from 'node:assert/strict';
import { DSA_CONCEPTS } from './dsa';
import { DSA_FLASHCARDS } from './flashcards';

test('every Java DSA topic has unique flashcards with worked solution steps', () => {
  const cardIds = new Set(DSA_FLASHCARDS.map((card) => card.id));
  const prompts = new Set(DSA_FLASHCARDS.map((card) => card.frontPrompt.trim().toLowerCase()));

  assert.equal(cardIds.size, DSA_FLASHCARDS.length, 'flashcard IDs should be unique');
  assert.equal(prompts.size, DSA_FLASHCARDS.length, 'flashcard prompts should be unique');

  for (const concept of DSA_CONCEPTS) {
    const cards = DSA_FLASHCARDS.filter((card) => card.conceptSlug === concept.slug);
    assert.equal(cards.length, 4, `${concept.slug} should have a complete four-card deck`);
  }

  for (const card of DSA_FLASHCARDS) {
    assert.ok(card.frontPrompt.trim(), `${card.id} should have a recall prompt`);
    assert.ok(card.backAnswer.trim(), `${card.id} should have an answer`);
    assert.ok(card.solutionSteps.length >= 2, `${card.id} should explain how to reach its answer`);
    assert.ok(card.solutionSteps.every((step) => step.trim().length > 8), `${card.id} should have clear solution steps`);
    assert.ok(card.formulaHint.trim(), `${card.id} should include a formula or reminder`);
    assert.ok(card.examTip.trim(), `${card.id} should include an exam tip`);
  }
});
