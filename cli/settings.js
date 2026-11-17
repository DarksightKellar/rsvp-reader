export const HOOK_MARKER = '# rsvp-reader';

const isOurs = h => typeof h.command === 'string' && h.command.includes(HOOK_MARKER);

/** Returns settings with every rsvp-reader hook removed (input untouched). */
export function removeHook(settings) {
  const next = structuredClone(settings);
  const stop = next.hooks?.Stop;
  if (!stop) return next;
  next.hooks.Stop = stop
    .map(g => ({ ...g, hooks: (g.hooks || []).filter(h => !isOurs(h)) }))
    .filter(g => g.hooks.length);
  if (!next.hooks.Stop.length) delete next.hooks.Stop;
  if (!Object.keys(next.hooks).length) delete next.hooks;
  return next;
}

/** Returns settings with a single rsvp-reader Stop hook running `command`. */
export function addHook(settings, command) {
  const next = removeHook(settings);
  next.hooks ??= {};
  next.hooks.Stop ??= [];
  next.hooks.Stop.push({ hooks: [{ type: 'command', command: `${command} ${HOOK_MARKER}`, timeout: 10 }] });
  return next;
}
