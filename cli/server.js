import http from 'node:http';

const MAX_BODY = 2_000_000;

/** Local reader server: page, bundle, SSE stream of replies, and an endpoint to post them. */
export function createServer({ bundle, page }) {
  const clients = new Set();
  let latest = null;

  const send = (res, status, body, type = 'text/plain') => {
    res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
    res.end(body);
  };

  return http.createServer((req, res) => {
    const { method, url } = req;
    if (method === 'GET' && url === '/') return send(res, 200, page, 'text/html');
    if (method === 'GET' && url === '/rsvp.min.js') return send(res, 200, bundle, 'text/javascript');
    if (method === 'GET' && url === '/health') return send(res, 200, JSON.stringify({ clients: clients.size }), 'application/json');
    if (method === 'GET' && url === '/latest') return send(res, 200, JSON.stringify(latest), 'application/json');
    if (method === 'GET' && url === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (method === 'POST' && url === '/reply') {
      let body = '';
      req.on('data', d => { body += d; if (body.length > MAX_BODY) req.destroy(); });
      req.on('end', () => {
        let text;
        try { text = JSON.parse(body).text; } catch { return send(res, 400, 'bad json'); }
        if (typeof text !== 'string' || !text.trim()) return send(res, 400, 'no text');
        latest = { text };
        const msg = `data: ${JSON.stringify(latest)}\n\n`;
        clients.forEach(c => c.write(msg));
        res.writeHead(204); res.end();
      });
      return;
    }
    send(res, 404, 'not found');
  });
}
