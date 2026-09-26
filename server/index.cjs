/**
 * Production server — serves the built Vite app (dist/) plus the
 * lab-notes API backed by PostgreSQL.
 *
 *   DATABASE_URL  postgres connection string (Render internal URL when
 *                 deployed on Render; external URL works too)
 *
 * When DATABASE_URL is unset the API falls back to the labs/ directory
 * on disk so `npm run lab-server`-style local dev still works.
 *
 * Usage:  npm run build && npm start
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8081;
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LABS = path.join(ROOT, 'labs');

/* ── Storage backend: Postgres when DATABASE_URL is set ── */
let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render Postgres requires SSL
  });
  pool.query(`
    CREATE TABLE IF NOT EXISTS lab_notes (
      module_id  TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `).then(() => console.log('  ✅ lab_notes table ready'))
    .catch(e => console.error('  ⚠️  Postgres init failed:', e.message));
} else if (!fs.existsSync(LABS)) {
  fs.mkdirSync(LABS);
}

const VALID_ID = /^[A-Za-z0-9_-]+$/;

async function notesGet(id) {
  if (!VALID_ID.test(id)) return '';
  if (pool) {
    const r = await pool.query('SELECT content FROM lab_notes WHERE module_id = $1', [id]);
    return r.rows[0]?.content || '';
  }
  const file = path.join(LABS, `${id}-lab.html`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

async function notesSave(id, content) {
  if (!VALID_ID.test(id)) return;
  const clean = content && content.trim() && content.trim() !== '<br>' ? content : '';
  if (pool) {
    if (clean) {
      await pool.query(
        `INSERT INTO lab_notes (module_id, content) VALUES ($1, $2)
         ON CONFLICT (module_id) DO UPDATE SET content = $2, updated_at = now()`,
        [id, clean]);
    } else {
      await pool.query('DELETE FROM lab_notes WHERE module_id = $1', [id]);
    }
    return;
  }
  const file = path.join(LABS, `${id}-lab.html`);
  if (clean) fs.writeFileSync(file, clean, 'utf8');
  else if (fs.existsSync(file)) fs.unlinkSync(file);
}

/* ── Static files ── */
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8', '.pdf': 'application/pdf',
  '.map': 'application/json', '.txt': 'text/plain',
};

function serve(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url, true).pathname);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: /api/lab/:moduleId ──
  const apiMatch = pathname.match(/^\/api\/lab\/([A-Za-z0-9_-]+)$/);
  if (apiMatch && req.method === 'GET') {
    try {
      const content = await notesGet(apiMatch[1]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (apiMatch && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const { content } = JSON.parse(body);
        await notesSave(apiMatch[1], content);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Static files + SPA fallback ──
  let filePath = path.join(DIST, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath) && !path.extname(pathname)) {
    // React Router route → index.html
    filePath = path.join(DIST, 'index.html');
  }
  serve(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n  🚀 Server running on port ${PORT}`);
  console.log(`  Static files: ${DIST}`);
  console.log(`  Lab notes:    ${pool ? 'PostgreSQL (DATABASE_URL)' : LABS}\n`);
});
