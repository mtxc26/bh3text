import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'node:stream';
import { writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const BASE = 'https://www.bh3text.com';

async function* walk(dir, base = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = join(dir, e.name);
        const rel = base + '/' + e.name;
        if (e.isDirectory()) {
            yield* walk(full, rel);
        } else if (e.name.endsWith('.html')) {
            yield rel;
        }
    }
}

export async function sitemap() {
    const links = [];
    for await (const url of walk(DIST)) {
        let clean = url.replace(/\.html$/, '');
        if (clean.endsWith('/index')) clean = clean.slice(0, -5);
        links.push({ url: clean });
    }

    const stream = new SitemapStream({ hostname: BASE });
    const data = await streamToPromise(Readable.from(links).pipe(stream));
    await writeFile(join(DIST, 'sitemap.xml'), data.toString(), 'utf-8');
    console.log(`  Sitemap generated: ${links.length} URLs`);
}
