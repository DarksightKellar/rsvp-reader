import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenize, orpIndex, focusSplit, delayFor, sentenceStart, nextSentenceStart,
  chunkAtWord, remainingMs, DEFAULTS,
} from '../src/core.js';

const one = (text, extra = {}) => ({ text, words: text.split(' ').length, paraEnd: false, ...extra });

test('tokenize splits words and marks paragraph ends', () => {
  const t = tokenize('Hello world.\n\nNext para', 1);
  assert.deepEqual(t.map(c => c.text), ['Hello', 'world.', 'Next', 'para']);
  assert.deepEqual(t.map(c => c.paraEnd), [false, true, false, true]);
});

test('tokenize records the source word index of each chunk', () => {
  const t = tokenize('a b c d e', 2);
  assert.deepEqual(t.map(c => c.text), ['a b', 'c d', 'e']);
  assert.deepEqual(t.map(c => c.start), [0, 2, 4]);
});

test('chunks never cross a sentence end', () => {
  assert.deepEqual(tokenize('One two. Three four', 3).map(c => c.text), ['One two.', 'Three four']);
});

test('tokenize handles empty input', () => {
  assert.deepEqual(tokenize('   \n\n ', 1), []);
});

test('orpIndex follows length bands and skips leading punctuation', () => {
  assert.equal(orpIndex('a'), 0);
  assert.equal(orpIndex('word'), 1);
  assert.equal(orpIndex('reading'), 2);
  assert.equal(orpIndex('comprehension'), 3);
  assert.equal(orpIndex('internationalisation'), 4);
  assert.equal(orpIndex('"word'), 2);
});

test('focusSplit anchors on the middle word of a chunk', () => {
  assert.deepEqual(focusSplit(one('reading')), ['re', 'a', 'ding']);
  assert.deepEqual(focusSplit(one('the cat sat')), ['the c', 'a', 't sat']);
});

test('delayFor base timing is 60000/wpm per word', () => {
  const o = { ...DEFAULTS, wpm: 300 };
  assert.equal(delayFor(one('cat'), o), 200);
  assert.equal(delayFor(one('the cat'), o), 400);
});

test('delayFor applies sentence, clause, long-word and paragraph pauses', () => {
  const o = { ...DEFAULTS, wpm: 600 };
  assert.equal(delayFor(one('end.'), o), 100 * o.sentencePause);
  assert.equal(delayFor(one('so,'), o), 100 * o.clausePause);
  assert.equal(delayFor(one('extraordinary'), o), 100 * o.longWordPause);
  assert.equal(delayFor(one('end.', { paraEnd: true }), o), 100 * o.paraPause);
});

test('delayFor pauses can be switched off', () => {
  const o = { ...DEFAULTS, wpm: 600, punctuationPauses: false, longWordPauses: false };
  assert.equal(delayFor(one('extraordinary.', { paraEnd: true }), o), 100);
});

test('sentence navigation finds sentence boundaries', () => {
  const t = tokenize('One two. Three four five. Six', 1);
  assert.equal(sentenceStart(t, 4), 2);
  assert.equal(sentenceStart(t, 2), 2);
  assert.equal(sentenceStart(t, 1), 0);
  assert.equal(nextSentenceStart(t, 0), 2);
  assert.equal(nextSentenceStart(t, 3), 5);
  assert.equal(nextSentenceStart(t, 5), 5);
});

test('chunkAtWord maps a word index to its chunk', () => {
  const t = tokenize('a b c d e', 2);
  assert.equal(chunkAtWord(t, 0), 0);
  assert.equal(chunkAtWord(t, 3), 1);
  assert.equal(chunkAtWord(t, 4), 2);
});

test('remainingMs sums delays from the current chunk', () => {
  const o = { ...DEFAULTS, wpm: 600, punctuationPauses: false, longWordPauses: false };
  assert.equal(remainingMs(tokenize('a b c', 1), 1, o), 200);
});
