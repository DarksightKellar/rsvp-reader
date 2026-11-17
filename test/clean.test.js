import test from 'node:test';
import assert from 'node:assert/strict';
import { toReadable } from '../cli/clean.js';

test('code blocks become a short pointer to the terminal', () => {
  const md = 'Run this:\n\n```sh\nnpm test\nnpm run build\n```\n\nThen done.';
  assert.equal(toReadable(md), 'Run this:\n\n(Code block, 2 lines, in the terminal.)\n\nThen done.');
});

test('inline formatting and links are stripped to plain words', () => {
  assert.equal(toReadable('Use **bold**, _italic_ and `npm ci`. See [the docs](https://x.y).'),
    'Use bold, italic and npm ci. See the docs.');
});

test('headings lose their hashes and become their own paragraph', () => {
  assert.equal(toReadable('## Summary\nAll good.'), 'Summary\n\nAll good.');
});

test('list items each become a paragraph with their markers removed', () => {
  assert.equal(toReadable('Changes:\n- added tests\n- fixed bug.\n1. first'), 'Changes:\n\nadded tests\n\nfixed bug.\n\nfirst');
});

test('tables become a pointer to the terminal', () => {
  const md = 'Results:\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nEnd.';
  assert.equal(toReadable(md), 'Results:\n\n(Table, 1 row, in the terminal.)\n\nEnd.');
});

test('plain prose passes through unchanged', () => {
  assert.equal(toReadable('Just words.\n\nMore words.'), 'Just words.\n\nMore words.');
});
