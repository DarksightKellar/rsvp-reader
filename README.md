# rsvp-reader

A drop-in RSVP (rapid serial visual presentation) speed reader. Words appear one at a time in a fixed spot with the focus letter highlighted, so your eyes stay still.

## Features

- Focus-letter (ORP) alignment with optional highlight
- 1–3 words per flash, never crossing a sentence end
- Adjustable speed (100–1000 wpm) and text size
- Longer pauses at sentence ends, commas and paragraph breaks, each adjustable or switchable off
- Longer holds for long words, with an adjustable length threshold
- Full-text panel: current word highlighted, tap any word to jump, copy, or paste new text
- Sentence back/forward, restart, scrubbing, time remaining
- Keyboard: space play/pause, ←/→ sentence, ↑/↓ speed
- Settings persist per browser; follows the host page's light/dark colour variables

## Usage

```html
<script type="text/plain" id="rsvp-source">Your text here.

Blank lines separate paragraphs.</script>
<script src="https://cdn.jsdelivr.net/gh/DarksightKellar/rsvp-reader@main/dist/rsvp.min.js"></script>
```

Every `<script type="text/plain">` with `id="rsvp-source"` or a `data-rsvp` attribute gets a player mounted right after it. For manual control: `RSVPReader.mount(hostElement, text)`.

## Claude Code

Claude Code runs in a terminal, so it can't draw the player inline. Instead, a Stop hook sends each finished reply to a local reader page that updates live and autoplays.

```sh
npx -y github:DarksightKellar/rsvp-reader install
```

This copies the reader to `~/.claude/rsvp-reader`, adds the hook to `~/.claude/settings.json` (backing up the original to `settings.json.bak-rsvp`), and works in every project. The page opens at http://127.0.0.1:4777 on the next reply whenever no reader tab is open. Run `node ~/.claude/rsvp-reader/cli/index.js uninstall` to remove it.

## Development

```sh
npm ci
npm test        # core timing, player UI (happy-dom), transcript parsing, settings merge, server
npm run build   # bundles src/ to dist/rsvp.min.js
```

`src/core.js` holds the pure tokenising and timing logic; `src/player.js` holds the UI, with storage, timers and clipboard injected for testing. Commit `dist/` after building; CI checks it is up to date. For a pinned, permanently cached version, replace `@main` with a commit SHA.
