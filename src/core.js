export const DEFAULTS = Object.freeze({
  wpm: 350,
  chunkSize: 1,
  punctuationPauses: true,
  longWordPauses: true,
  sentencePause: 2.2,
  clausePause: 1.5,
  paraPause: 3,
  longWordPause: 1.4,
  longWordLength: 9,
  orpHighlight: true,
  fontSize: 44,
});

export const SENTENCE_END = /[.!?…]["'”’)\]]*$/;
const CLAUSE_END = /[,;:—–-]["'”’)\]]*$/;

export function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.split(/\s+/).filter(Boolean))
    .filter(ws => ws.length);
}

export function tokenize(text, chunkSize) {
  const size = Math.max(1, chunkSize | 0);
  const words = splitParagraphs(text).flatMap(ws =>
    ws.map((w, i) => ({ w, paraEnd: i === ws.length - 1 }))
  );
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const start = i;
    const group = [];
    while (i < words.length && group.length < size) {
      const cur = words[i++];
      group.push(cur);
      if (cur.paraEnd || SENTENCE_END.test(cur.w)) break;
    }
    chunks.push({
      text: group.map(g => g.w).join(' '),
      words: group.length,
      start,
      paraEnd: group[group.length - 1].paraEnd,
    });
  }
  return chunks;
}

export function orpIndex(word) {
  const lead = (word.match(/^[^\p{L}\p{N}]*/u) || [''])[0].length;
  const len = word.replace(/[^\p{L}\p{N}]/gu, '').length;
  const band = len <= 1 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : len <= 13 ? 3 : 4;
  return Math.min(lead + band, Math.max(0, word.length - 1));
}

/** Splits a chunk into left / focus letter / right, anchoring on its middle word. */
export function focusSplit(chunk) {
  const parts = chunk.text.split(' ');
  const mid = Math.floor((parts.length - 1) / 2);
  const offset = mid ? parts.slice(0, mid).join(' ').length + 1 : 0;
  const p = offset + orpIndex(parts[mid]);
  return [chunk.text.slice(0, p), chunk.text.charAt(p), chunk.text.slice(p + 1)];
}

export function delayFor(chunk, o) {
  const base = (60000 / o.wpm) * chunk.words;
  let m = 1;
  if (o.punctuationPauses) {
    if (chunk.paraEnd) m = Math.max(m, o.paraPause);
    else if (SENTENCE_END.test(chunk.text)) m = Math.max(m, o.sentencePause);
    else if (CLAUSE_END.test(chunk.text)) m = Math.max(m, o.clausePause);
  }
  if (o.longWordPauses && chunk.text.split(' ').some(w => w.length >= o.longWordLength)) {
    m = Math.max(m, o.longWordPause);
  }
  return base * m;
}

const endsSentence = c => c.paraEnd || SENTENCE_END.test(c.text);

export function sentenceStart(chunks, idx) {
  let i = Math.min(idx, chunks.length - 1);
  while (i > 0 && !endsSentence(chunks[i - 1])) i--;
  return i;
}

export function nextSentenceStart(chunks, idx) {
  let i = idx;
  while (i < chunks.length - 1 && !endsSentence(chunks[i])) i++;
  return Math.min(i + 1, chunks.length - 1);
}

export function chunkAtWord(chunks, wordIndex) {
  let c = 0;
  while (c < chunks.length - 1 && chunks[c + 1].start <= wordIndex) c++;
  return c;
}

export function remainingMs(chunks, idx, o) {
  let ms = 0;
  for (let i = idx; i < chunks.length; i++) ms += delayFor(chunks[i], o);
  return ms;
}
