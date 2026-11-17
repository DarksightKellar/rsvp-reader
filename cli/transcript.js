const parse = l => { try { return JSON.parse(l); } catch { return null; } };

const isRealUserTurn = e =>
  e.type === 'user' &&
  !(Array.isArray(e.message?.content) && e.message.content.every(b => b.type === 'tool_result'));

/** Text of the assistant's final turn in a Claude Code transcript (JSONL). */
export function lastReply(jsonl) {
  const entries = jsonl.split('\n').map(parse).filter(e => e && (e.type === 'user' || e.type === 'assistant'));
  let start = 0;
  entries.forEach((e, i) => { if (isRealUserTurn(e)) start = i + 1; });
  return entries
    .slice(start)
    .filter(e => e.type === 'assistant' && Array.isArray(e.message?.content))
    .flatMap(e => e.message.content.filter(b => b.type === 'text' && b.text.trim()).map(b => b.text.trim()))
    .join('\n\n');
}
