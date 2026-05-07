import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'node:stream';
import { writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_BASE } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

async function* walk(dir, base = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = join(dir, e.name);
        const rel = base + '/' + e.name;
        if (e.isDirectory()) {
            yield* walk(full, rel);
        } else if (e.name.endsWith('.html')) {
            const s = await stat(full);
            yield { url: rel, lastmod: s.mtime.toISOString().split('T')[0] };
        }
    }
}

export async function sitemap() {
    const links = [];
    for await (const { url, lastmod } of walk(DIST)) {
        let clean = url;
        const isIndex = clean.endsWith('/index.html');
        if (isIndex) clean = clean.slice(0, -10);
        const priority = clean === '/' ? 1.0 : isIndex ? 0.8 : 0.5;
        links.push({ url: clean, changefreq: 'monthly', lastmod, priority });
    }

    const stream = new SitemapStream({ hostname: SITE_BASE });
    const data = await streamToPromise(Readable.from(links).pipe(stream));
    await writeFile(join(DIST, 'sitemap.xml'), data.toString(), 'utf-8');
    console.log(`  Sitemap generated: ${links.length} URLs`);
}
