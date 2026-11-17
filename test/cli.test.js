import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { lastReply } from '../cli/transcript.js';
import { addHook, removeHook, HOOK_MARKER } from '../cli/settings.js';
import { createServer } from '../cli/server.js';

const line = o => JSON.stringify(o);
const user = text => line({ type: 'user', message: { role: 'user', content: text } });
const toolResult = () => line({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'ok' }] } });
const assistant = (...blocks) => line({ type: 'assistant', message: { role: 'assistant', content: blocks } });
const text = t => ({ type: 'text', text: t });
const tool = () => ({ type: 'tool_use', id: 'x', name: 'Bash', input: {} });

test('lastReply joins the text of the final turn across tool calls', () => {
  const jsonl = [
    user('first question'), assistant(text('Old answer.')),
    user('second question'), assistant(text('Let me check.'), tool()), toolResult(),
    assistant(text('All done.')),
  ].join('\n');
  assert.equal(lastReply(jsonl), 'Let me check.\n\nAll done.');
});

test('lastReply ignores malformed lines and non-message entries', () => {
  const jsonl = ['{oops', line({ type: 'summary', summary: 's' }), user('q'), assistant(text('Answer.'))].join('\n');
  assert.equal(lastReply(jsonl), 'Answer.');
});

test('lastReply returns empty string when there is no reply text', () => {
  assert.equal(lastReply([user('q'), assistant(tool())].join('\n')), '');
  assert.equal(lastReply(''), '');
});

test('addHook adds a Stop hook without disturbing existing settings', () => {
  const before = { model: 'opus', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'other' }] }] } };
  const after = addHook(before, 'node /x/cli.js hook');
  assert.equal(after.model, 'opus');
  assert.equal(after.hooks.Stop.length, 2);
  assert.equal(after.hooks.Stop[1].hooks[0].command, `node /x/cli.js hook ${HOOK_MARKER}`);
  assert.equal(before.hooks.Stop.length, 1, 'input not mutated');
});

test('addHook is idempotent and replaces an older install', () => {
  const once = addHook({}, 'node /old/cli.js hook');
  const twice = addHook(once, 'node /new/cli.js hook');
  assert.equal(twice.hooks.Stop.length, 1);
  assert.match(twice.hooks.Stop[0].hooks[0].command, /\/new\//);
});

test('removeHook removes only this tool\'s hook', () => {
  const s = addHook({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'other' }] }] } }, 'node /x/cli.js hook');
  const r = removeHook(s);
  assert.deepEqual(r.hooks.Stop, [{ hooks: [{ type: 'command', command: 'other' }] }]);
  assert.deepEqual(removeHook(addHook({}, 'c')), {});
});

function request(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: { 'content-type': 'application/json' } }, res => {
      let data = ''; res.on('data', d => (data += d)); res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('server serves the page and bundle, and streams posted replies', async () => {
  const srv = createServer({ bundle: 'BUNDLE', page: '<html>PAGE</html>' });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const { port } = srv.address();
  try {
    assert.match((await request(port, 'GET', '/')).data, /PAGE/);
    assert.equal((await request(port, 'GET', '/rsvp.min.js')).data, 'BUNDLE');
    assert.equal((await request(port, 'GET', '/health')).status, 200);

    const got = new Promise(resolve => {
      http.get({ host: '127.0.0.1', port, path: '/events' }, res => {
        let buf = '';
        res.on('data', d => {
          buf += d;
          const m = buf.match(/data: (.*)\n\n/g);
          if (m && m.some(x => x.includes('Hi there'))) { res.destroy(); resolve(buf); }
        });
      });
    });
    await new Promise(r => setTimeout(r, 50));
    assert.equal((await request(port, 'POST', '/reply', JSON.stringify({ text: 'Hi there' }))).status, 204);
    assert.match(await got, /Hi there/);

    assert.equal((await request(port, 'POST', '/reply', '{bad')).status, 400);
    assert.equal((await request(port, 'GET', '/latest')).data, JSON.stringify({ text: 'Hi there' }));
  } finally {
    srv.closeAllConnections?.();
    srv.close();
  }
});
