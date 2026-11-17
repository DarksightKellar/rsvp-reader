const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const inline = s => s
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/(\*\*|__)(.+?)\1/g, '$2')
  .replace(/(^|[\s(])[*_](\S(?:.*?\S)?)[*_](?=[\s).,;:!?]|$)/g, '$1$2');

/** Turns a markdown reply into prose that reads well one word at a time. */
export function toReadable(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  const flush = () => { if (para.length) out.push(para.join(' ')); para = []; };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      flush();
      let n = 0;
      while (++i < lines.length && !lines[i].trimStart().startsWith(fence[1])) n++;
      out.push(`(Code block, ${plural(n, 'line')}, in the terminal.)`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flush();
      let rows = 0;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows++;
        i++;
      }
      i--;
      out.push(`(Table, ${plural(Math.max(0, rows - 1), 'row')}, in the terminal.)`);
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    const item = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (heading || item) { flush(); out.push(inline((heading || item)[1].trim())); continue; }
    para.push(inline(line.trim()));
  }
  flush();
  return out.filter(Boolean).join('\n\n');
}
