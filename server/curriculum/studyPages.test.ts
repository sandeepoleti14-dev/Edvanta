import test from 'node:test';
import assert from 'node:assert/strict';
import { DSA_CONCEPTS } from './dsa';
import { DSA_MODULES } from './modules';
import { DSA_STUDY_PAGES } from './studyPages';

test('every DSA topic has complete, paginated study material with Java examples', () => {
  assert.equal(DSA_MODULES.length, DSA_CONCEPTS.length);
  assert.equal(Object.values(DSA_STUDY_PAGES).flat().length, DSA_CONCEPTS.length * 3);

  for (const module of DSA_MODULES) {
    const pages = DSA_STUDY_PAGES[module.conceptSlug];
    assert.equal(pages?.length, 3, `${module.conceptSlug} should have three printable reader pages`);
    assert.equal(
      new Set(pages.map((page) => page.title.trim().toLowerCase())).size,
      pages.length,
      `${module.conceptSlug} should not repeat a study-page title in its PDF`
    );

    for (const page of pages) {
      assert.ok(page.title.trim(), `${module.conceptSlug} page should have a title`);
      assert.ok(page.sections.length > 0, `${module.conceptSlug} page should have explanatory sections`);
      assert.ok(page.sections.some((section) => section.paragraphs.some((paragraph) => paragraph.length > 40)));
      assert.ok(
        page.sections.some((section) => section.code || section.bullets?.length || section.paragraphs.length),
        `${module.conceptSlug} page should include printable study content`
      );
      assert.ok(page.takeaway.trim(), `${module.conceptSlug} page should end with a takeaway`);
    }

    assert.ok(
      pages.some((page) => page.sections.some((section) => section.code?.includes('\n'))),
      `${module.conceptSlug} should include a readable code example`
    );
  }
});
