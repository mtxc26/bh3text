import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, cp, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import chokidar from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const DIST = join(ROOT, 'dist');
const RUNTIME_DIST = join(ROOT, 'runtime', 'dist');
const PAGE_DIR = join(ROOT, 'page');
const PUBLIC_DIR = join(ROOT, 'public');
const PORT = 8000;

// ── helpers ──────────────────────────────────────────────

let rebuildTimer = null;
function debounce(fn, ms = 300) {
  return (...args) => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => fn(...args), ms);
  };
}

async function runPrepare() {
  const { prepare } = await import('./build/prepare.mjs');
  await prepare();
}

async function runEjs() {
  const { dialog } = await import('./build/dialog.mjs');
  const { pages } = await import('./build/pages.mjs');
  const { sitemap } = await import('./build/sitemap.mjs');
  await dialog();
  await pages();
  await sitemap();
}

async function copyRuntime() {
  const dest = join(DIST, '_r', 'runtime');
  await cp(RUNTIME_DIST, dest, { recursive: true, force: true });
  console.log('  ✅ runtime copied to dist/_r/runtime');
}

// ── MIME ─────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

// ── static server ────────────────────────────────────────

async function tryServe(res, filePath) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
    return true;
  } catch { return false; }
}

function startServer() {
  createServer(async (req, res) => {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';

    const filePath = join(DIST, url);

    // security
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // 1. exact file match
    if (existsSync(filePath)) {
      const s = await stat(filePath);
      if (s.isDirectory()) {
        // try index.html inside directory
        if (await tryServe(res, join(filePath, 'index.html'))) return;
      } else {
        if (await tryServe(res, filePath)) return;
      }
    }

    // 2. try appending .html (for clean URLs like /dialog/foo/bar)
    if (!extname(filePath) && await tryServe(res, filePath + '.html')) return;

    // 3. 404
    res.writeHead(404);
    res.end('Not Found');
  }).listen(PORT, () => {
    console.log('  🌐 Dev server: http://localhost:' + PORT + '/');
  });
}

// ── file watchers ────────────────────────────────────────

function setupWatchers() {
  const rebuildEjs = debounce(async (filePath) => {
    console.log('\n📄 ' + filePath + ' changed → rebuilding EJS...');
    try {
      if (filePath.startsWith(PUBLIC_DIR)) {
        await cp(PUBLIC_DIR, DIST, { recursive: true, force: true });
        console.log('  ✅ public copied');
      }
      await runEjs();
      console.log('  ✅ EJS done');
    } catch (e) {
      console.error('  ❌ EJS error:', e.message);
    }
  }, 400);

  chokidar.watch([PAGE_DIR, PUBLIC_DIR], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  }).on('all', (_evt, path) => rebuildEjs(path));

  const copyRt = debounce(async (filePath) => {
    console.log('\n🔧 ' + filePath + ' changed → copying runtime...');
    try {
      await copyRuntime();
    } catch (e) {
      console.error('  ❌ copy error:', e.message);
    }
  }, 300);

  chokidar.watch(RUNTIME_DIST, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
  }).on('all', (_evt, path) => copyRt(path));

  console.log('  👀 Watching page/, public/, runtime/dist/');
}

// ── main ─────────────────────────────────────────────────

console.log('🛠  bh3text dev\n');

console.log('📦 Initializing...');
await runPrepare();
console.log('  ✅ prepare done');
await runEjs();
console.log('  ✅ EJS done');

console.log('\n⚙️  Starting runtime build --watch...');
const viteCmd = process.platform === 'win32'
  ? { cmd: 'cmd', args: ['/D', '/S', '/C', 'npx vite build --watch'] }
  : { cmd: 'npx', args: ['vite', 'build', '--watch'] };
const viteWatch = spawn(viteCmd.cmd, viteCmd.args, {
  cwd: join(ROOT, 'runtime'),
  stdio: 'inherit',
});
viteWatch.on('error', (err) => console.error('vite spawn error:', err));

setupWatchers();
startServer();

process.on('SIGINT', () => {
  viteWatch.kill();
  process.exit(0);
});
