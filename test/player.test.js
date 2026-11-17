import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { mount, safeStorage } from '../src/player.js';
import { mountAll } from '../src/index.js';

function setup(text = 'One two. Three four.\n\nFive six.', saved = {}) {
  const win = new Window();
  const doc = win.document;
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  const timers = [];
  const store = { data: { ...saved }, load() { return { ...this.data }; }, save(o) { this.data = { ...o }; } };
  const p = mount(host, text, {
    storage: store,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: () => {},
  });
  const q = s => p.root.querySelector(s);
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  const runNext = () => timers.shift().fn();
  return { win, doc, p, q, click, runNext, timers, store };
}

const shown = q => q('.rsvp-word').textContent;

test('shows the first word with its focus letter highlighted', () => {
  const { q } = setup();
  assert.equal(shown(q), 'One');
  assert.equal(q('.rsvp-c').textContent, 'n');
  assert.ok(q('.rsvp-c').classList.contains('hl'));
});

test('play advances words on the computed delay and pauses', () => {
  const { q, click, runNext, timers } = setup();
  click(q('[data-a="play"]'));
  assert.equal(q('[data-a="play"]').textContent, 'Pause');
  assert.equal(timers[0].ms, 60000 / 350);
  runNext();
  assert.equal(shown(q), 'two.');
  click(q('[data-a="play"]'));
  assert.equal(q('[data-a="play"]').textContent, 'Play');
});

test('sentence navigation buttons jump between sentences', () => {
  const { q, click } = setup();
  click(q('[data-a="fwd"]'));
  assert.equal(shown(q), 'Three');
  click(q('[data-a="fwd"]'));
  assert.equal(shown(q), 'Five');
  click(q('[data-a="back"]'));
  assert.equal(shown(q), 'Three');
});

test('text panel shows the full text and jumps on word tap', () => {
  const { q, click } = setup();
  click(q('[data-p="text"]'));
  assert.equal(q('[data-panel="text"]').hidden, false);
  assert.equal(q('[data-r="text"]').querySelectorAll('p').length, 2);
  click(q('[data-i="4"]'));
  assert.equal(shown(q), 'Five');
  assert.ok(q('[data-i="4"]').classList.contains('on'));
});

test('editing loads new text', () => {
  const { q, click } = setup();
  click(q('[data-a="edit"]'));
  q('[data-r="ta"]').value = 'Brand new words';
  click(q('[data-a="load"]'));
  assert.equal(shown(q), 'Brand');
  assert.equal(q('[data-r="text"]').textContent.trim(), 'Brand new words');
});

test('settings change, persist and reset', () => {
  const { win, q, click, p, store } = setup();
  const wpm = q('[data-k="wpm"]');
  wpm.value = '500';
  wpm.dispatchEvent(new win.Event('input', { bubbles: true }));
  assert.equal(p.settings.wpm, 500);
  assert.equal(store.data.wpm, 500);
  assert.equal(q('[data-v="wpm"]').textContent, '500 wpm');
  click(q('[data-a="reset"]'));
  assert.equal(p.settings.wpm, 350);
});

test('words per flash regroups while keeping the place', () => {
  const { win, q, click } = setup();
  click(q('[data-a="fwd"]'));
  const c = q('[data-k="chunkSize"]');
  c.value = '2';
  c.dispatchEvent(new win.Event('input', { bubbles: true }));
  assert.equal(shown(q), 'Three four.');
});

test('saved settings are restored on mount', () => {
  const { p, q } = setup(undefined, { wpm: 600, orpHighlight: false });
  assert.equal(p.settings.wpm, 600);
  assert.ok(!q('.rsvp-c').classList.contains('hl'));
});

test('safeStorage survives a throwing store', () => {
  const s = safeStorage({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } });
  assert.deepEqual(s.load(), {});
  assert.doesNotThrow(() => s.save({ a: 1 }));
});

test('mountAll mounts each source script once', () => {
  const win = new Window();
  const doc = win.document;
  doc.body.innerHTML = '<script type="text/plain" id="rsvp-source">Hello there.</script>';
  assert.equal(mountAll(doc).length, 1);
  assert.equal(mountAll(doc).length, 0);
  assert.ok(doc.querySelector('.rsvp'));
});

test('load swaps in new text and can autoplay', () => {
  const { p, q } = setup();
  p.load('Fresh reply here.', { autoplay: true });
  assert.equal(shown(q), 'Fresh');
  assert.equal(q('[data-a="play"]').textContent, 'Pause');
});
