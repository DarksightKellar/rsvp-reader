import * as core from './core.js';
import { CSS } from './styles.js';

const STORAGE_KEY = 'rsvp-settings-v1';
const NUMERIC = {
  wpm: ['Speed', 100, 1000, 10, v => `${v} wpm`],
  chunkSize: ['Words per flash', 1, 3, 1, v => `${v}`],
  fontSize: ['Text size', 24, 80, 2, v => `${v}px`],
  sentencePause: ['Sentence end', 1, 4, 0.1, v => `${(+v).toFixed(1)}×`],
  clausePause: ['Comma / clause', 1, 3, 0.1, v => `${(+v).toFixed(1)}×`],
  paraPause: ['Paragraph end', 1, 6, 0.1, v => `${(+v).toFixed(1)}×`],
  longWordLength: ['Long word from', 6, 16, 1, v => `${v} letters`],
  longWordPause: ['Hold for', 1, 3, 0.1, v => `${(+v).toFixed(1)}×`],
};
const TOGGLES = {
  orpHighlight: 'Highlight the focus letter',
  punctuationPauses: 'Pause longer at punctuation',
  longWordPauses: 'Hold long words longer',
};

const slider = k => {
  const [label, min, max, step] = NUMERIC[k];
  return `<label class="f"><span>${label} <b data-v="${k}"></b></span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"></label>`;
};
const toggle = k => `<label class="t"><input type="checkbox" data-t="${k}"> ${TOGGLES[k]}</label>`;
const PATHS = {
  'player-skip-back': 'M20 5v14L9 12zM4 5v14',
  'arrow-back-up': 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  'arrow-forward-up': 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};
const icon = name => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;pointer-events:none"><path d="${PATHS[name]}"/></svg>`;

const TEMPLATE = `
<div class="rsvp-stage" data-r="stage"><div class="rsvp-word"><span class="rsvp-l"></span><span class="rsvp-c"></span><span class="rsvp-r"></span></div><div class="rsvp-hint" data-r="hint">tap to play</div></div>
<div class="rsvp-prow"><input type="range" data-r="seek" min="0" max="0" value="0" aria-label="Position" style="flex:1"><div class="rsvp-meta" data-r="meta"></div></div>
<div class="rsvp-bar">
  <button class="rsvp-btn" data-a="restart" aria-label="Restart">${icon('player-skip-back')}</button>
  <button class="rsvp-btn" data-a="back" aria-label="Previous sentence">${icon('arrow-back-up')}</button>
  <button class="rsvp-btn primary" data-a="play">Play</button>
  <button class="rsvp-btn" data-a="fwd" aria-label="Next sentence">${icon('arrow-forward-up')}</button>
  <div class="rsvp-grow"></div>
  <button class="rsvp-btn" data-p="text" aria-pressed="false">Text</button>
  <button class="rsvp-btn" data-p="settings" aria-pressed="false" aria-label="Settings">${icon('settings')}</button>
</div>
<div class="rsvp-panel" data-panel="text" hidden>
  <div class="rsvp-bar" style="margin:0 0 10px"><div class="rsvp-grow rsvp-meta">Tap any word to jump there</div><button class="rsvp-btn" data-a="copy">Copy</button><button class="rsvp-btn" data-a="edit">Edit / paste</button></div>
  <div class="rsvp-text" data-r="text"></div>
  <div data-r="editor" hidden><textarea data-r="ta" placeholder="Paste text here"></textarea><div class="rsvp-row"><button class="rsvp-btn" data-a="cancel">Cancel</button><button class="rsvp-btn primary" data-a="load">Load</button></div></div>
</div>
<div class="rsvp-panel" data-panel="settings" hidden>
  <div class="rsvp-grid">${['wpm', 'chunkSize', 'fontSize'].map(slider).join('')}</div>
  <div class="rsvp-sub">Focus point</div>${toggle('orpHighlight')}
  <div class="rsvp-sub">Punctuation pauses</div>${toggle('punctuationPauses')}
  <div class="rsvp-grid" style="margin-top:8px">${['sentencePause', 'clausePause', 'paraPause'].map(slider).join('')}</div>
  <div class="rsvp-sub">Long words</div>${toggle('longWordPauses')}
  <div class="rsvp-grid" style="margin-top:8px">${['longWordLength', 'longWordPause'].map(slider).join('')}</div>
  <div class="rsvp-row"><button class="rsvp-btn" data-a="reset">Reset to defaults</button></div>
</div>`;

export function safeStorage(store) {
  return {
    load() { try { return JSON.parse(store.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } },
    save(o) { try { store.setItem(STORAGE_KEY, JSON.stringify(o)); } catch { /* storage unavailable */ } },
  };
}

function injectStyles(doc) {
  if (doc.getElementById('rsvp-styles')) return;
  const s = doc.createElement('style');
  s.id = 'rsvp-styles';
  s.textContent = CSS;
  doc.head.appendChild(s);
}

/**
 * Mounts a player for `text` inside `host`.
 * Dependencies (storage, timers, clipboard) are injected so the player is testable.
 */
export function mount(host, text, deps = {}) {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const storage = deps.storage || safeStorage(win.localStorage);
  const setT = deps.setTimeout || win.setTimeout.bind(win);
  const clearT = deps.clearTimeout || win.clearTimeout.bind(win);

  injectStyles(doc);
  const root = doc.createElement('div');
  root.className = 'rsvp';
  root.innerHTML = TEMPLATE;
  host.appendChild(root);

  const $ = sel => root.querySelector(sel);
  const ref = name => $(`[data-r="${name}"]`);
  const [L, C, R] = $('.rsvp-word').children;

  let o = { ...core.DEFAULTS, ...storage.load() };
  let source = text.trim();
  let chunks = [];
  let idx = 0;
  let timer = null;
  let playing = false;
  let lit = [];

  const persist = () => storage.save(o);

  function rebuild(keepPlace) {
    const word = chunks[idx] ? chunks[idx].start : 0;
    chunks = core.tokenize(source, o.chunkSize);
    idx = keepPlace ? core.chunkAtWord(chunks, word) : 0;
    ref('seek').max = Math.max(0, chunks.length - 1);
    renderText();
    show();
  }

  function show() {
    const ch = chunks[idx];
    const [l, c, r] = ch ? core.focusSplit(ch) : ['', '', ''];
    L.textContent = l; C.textContent = c; R.textContent = r;
    C.classList.toggle('hl', o.orpHighlight);
    ref('seek').value = idx;
    highlight();
    updateMeta();
  }

  function updateMeta() {
    const s = Math.round(core.remainingMs(chunks, idx, o) / 1000);
    const last = chunks[chunks.length - 1];
    const total = last ? last.start + last.words : 0;
    const at = chunks[idx] ? chunks[idx].start + 1 : 0;
    ref('meta').textContent = `${at}/${total} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function tick() {
    if (!playing) return;
    if (idx >= chunks.length - 1) { pause(); ref('hint').textContent = 'done · tap to replay'; return; }
    timer = setT(() => { idx++; show(); tick(); }, core.delayFor(chunks[idx], o));
  }
  function play() {
    if (!chunks.length) return;
    if (idx >= chunks.length - 1) idx = 0;
    playing = true;
    $('[data-a="play"]').textContent = 'Pause';
    ref('hint').textContent = '';
    show(); tick();
  }
  function pause() {
    playing = false; clearT(timer);
    $('[data-a="play"]').textContent = 'Play';
    ref('hint').textContent = 'tap to play';
  }
  const togglePlay = () => (playing ? pause() : play());
  function jump(i) {
    const was = playing;
    pause();
    idx = Math.max(0, Math.min(chunks.length - 1, i));
    show();
    if (was) play();
  }
  function back() {
    let s = core.sentenceStart(chunks, idx);
    if (s === idx && idx > 0) s = core.sentenceStart(chunks, idx - 1);
    jump(s);
  }

  function renderText() {
    const box = ref('text');
    box.innerHTML = '';
    let n = 0;
    core.splitParagraphs(source).forEach(ws => {
      const p = doc.createElement('p');
      ws.forEach(w => {
        const s = doc.createElement('span');
        s.className = 'rsvp-w'; s.dataset.i = n++; s.textContent = w;
        p.append(s, ' ');
      });
      box.appendChild(p);
    });
  }
  function highlight() {
    lit.forEach(e => e.classList.remove('on'));
    lit = [];
    const ch = chunks[idx];
    if (!ch) return;
    for (let k = ch.start; k < ch.start + ch.words; k++) {
      const e = ref('text').querySelector(`[data-i="${k}"]`);
      if (e) { e.classList.add('on'); lit.push(e); }
    }
  }

  function applySettingsUI() {
    Object.keys(NUMERIC).forEach(k => {
      $(`[data-k="${k}"]`).value = o[k];
      $(`[data-v="${k}"]`).textContent = NUMERIC[k][4](o[k]);
    });
    Object.keys(TOGGLES).forEach(k => { $(`[data-t="${k}"]`).checked = o[k]; });
    $('.rsvp-word').style.fontSize = `${o.fontSize}px`;
  }

  const actions = {
    play: togglePlay,
    restart: () => jump(0),
    back,
    fwd: () => jump(core.nextSentenceStart(chunks, idx)),
    edit: () => { ref('ta').value = source; ref('editor').hidden = false; ref('text').hidden = true; },
    cancel: () => { ref('editor').hidden = true; ref('text').hidden = false; },
    load: () => {
      const v = ref('ta').value.trim();
      if (!v) return;
      pause(); source = v; idx = 0;
      actions.cancel(); rebuild(false);
    },
    copy: async () => {
      const btn = $('[data-a="copy"]');
      try { await (deps.clipboard || win.navigator.clipboard).writeText(source); btn.textContent = 'Copied'; }
      catch { btn.textContent = 'Select text to copy'; }
      setT(() => { btn.textContent = 'Copy'; }, 1500);
    },
    reset: () => { o = { ...core.DEFAULTS }; persist(); applySettingsUI(); rebuild(true); },
  };

  root.addEventListener('click', e => {
    const a = e.target.closest('[data-a]');
    if (a) return actions[a.dataset.a]();
    const p = e.target.closest('[data-p]');
    if (p) {
      const panel = $(`[data-panel="${p.dataset.p}"]`);
      panel.hidden = !panel.hidden;
      p.setAttribute('aria-pressed', String(!panel.hidden));
      return;
    }
    if (e.target.closest('[data-r="stage"]')) return togglePlay();
    const w = e.target.closest('.rsvp-w');
    if (w) jump(core.chunkAtWord(chunks, +w.dataset.i));
  });
  root.addEventListener('input', e => {
    const k = e.target.dataset.k;
    if (e.target.dataset.r === 'seek') return jump(+e.target.value);
    if (!k) return;
    o[k] = +e.target.value; persist(); applySettingsUI();
    if (k === 'chunkSize') rebuild(true); else show();
  });
  root.addEventListener('change', e => {
    const k = e.target.dataset.t;
    if (!k) return;
    o[k] = e.target.checked; persist(); show();
  });
  doc.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowLeft') back();
    else if (e.key === 'ArrowRight') actions.fwd();
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      o.wpm = Math.max(100, Math.min(1000, o.wpm + (e.key === 'ArrowUp' ? 25 : -25)));
      persist(); applySettingsUI(); updateMeta();
    }
  });

  applySettingsUI();
  rebuild(false);

  return {
    root, play, pause, jump,
    load(newText, { autoplay = false } = {}) {
      pause(); source = newText.trim(); idx = 0;
      actions.cancel(); rebuild(false);
      if (autoplay) play();
    },
    get index() { return idx; },
    get chunks() { return chunks; },
    get settings() { return { ...o }; },
  };
}
