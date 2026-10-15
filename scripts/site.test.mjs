import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from './summaries.mjs';
import { portableTextToHtml } from './sanity-content.mjs';

test('automatic summaries end at a sentence when possible', () => {
  const opening = 'We all carry dreams in our hearts, and with them, a certain timeline in our minds.';
  assert.equal(summarize(`${opening} ${'More words follow '.repeat(20)}`), opening);
});
test('a long first sentence is shortened at a word boundary', () => {
  const result = summarize('Mentorship opens doors '.repeat(25));
  assert.ok(result.length <= 181);
  assert.ok(result.endsWith('doors…') || result.endsWith('opens…') || result.endsWith('Mentorship…'));
});
test('short summaries and apostrophes remain intact', () => {
  assert.equal(summarize('  Desire is the spark, yes, but structure is the fuel.  '), 'Desire is the spark, yes, but structure is the fuel.');
});
test('pasted line breaks remain separate paragraphs', () => {
  const result = portableTextToHtml([{ _type: 'block', children: [{ text: 'First paragraph\n\nSecond paragraph', marks: [] }] }]);
  assert.match(result, /<p>First paragraph<\/p>/);
  assert.match(result, /<p class="article-closing">Second paragraph<\/p>/);
});
test('formatting spanning pasted paragraphs remains valid', () => {
  const result = portableTextToHtml([{ _type: 'block', children: [{ text: 'First\nSecond', marks: ['strong'] }] }]);
  assert.match(result, /<p><strong>First<\/strong><\/p>/);
  assert.match(result, /<p class="article-closing"><strong>Second<\/strong><\/p>/);
});
