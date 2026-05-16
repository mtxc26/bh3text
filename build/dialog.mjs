import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import { SITE_BASE, addAssetRefs, toChapterNumber, DOMAIN_LABELS, MARS_STAGE_NUMBER_MAP } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PAGES_DIR = join(ROOT, 'data', 'dist', 'pages');
const DIST_DIR = join(ROOT, 'dist', 'dialog');
const TPL = join(ROOT, 'page', 'dialog.ejs');

async function loadJSON(p) {
    return JSON.parse(await readFile(p, 'utf-8'));
}

async function renderPages(template, category, urlDir) {
    const pages = await loadJSON(join(PAGES_DIR, `${category}.json`));
    let count = 0;

    for (const pg of pages) {
        const chapter = pg.c;
        const outDir = join(DIST_DIR, urlDir, chapter);
        await mkdir(outDir, { recursive: true });

        const urlParts = pg.u.split('/');
        const fname = decodeURIComponent(urlParts[urlParts.length - 1]);
        const isMarsCompanion = category === 'main2' && String(pg.c).includes('.5') && MARS_STAGE_NUMBER_MAP[String(pg.c)];
        const categoryLabel = category === 'er' ? '往世乐土' : category === 'main1' ? DOMAIN_LABELS.main || '主线第一部' : isMarsCompanion ? '梦间拾集' : DOMAIN_LABELS.main2 || '主线第二部';
        const chapterNum = category === 'er' || isMarsCompanion ? '' : toChapterNumber(pg.c);
        const head = categoryLabel + chapterNum;
        const hierarchyTitle = [head, pg.ct].filter(Boolean).join(' ') + (pg.pt ? ' > ' + pg.pt : '');
        const hierarchyTitleNoSpace = hierarchyTitle;
        const hierarchyTitleB64 = Buffer.from(hierarchyTitleNoSpace).toString('base64');

        const canonicalUrl = SITE_BASE + pg.u;
        const html = ejs.render(
            template,
            {
                title: pg.pt,
                stageTitle: pg.pt,
                hierarchyTitle,
                hierarchyTitleNoSpace,
                hierarchyTitleB64,
                canonicalUrl,
                desc: pg.desc || '',
                dialogs: pg.blocks,
                up: pg.up ? pg.up : `/dialog/${urlDir}/${chapter}/`,
                prev: pg.prev ? { url: pg.prev.u, title: pg.prev.t } : null,
                next: pg.next ? { url: pg.next.u, title: pg.next.t } : null,
            },
            { rmWhitespace: true, filename: TPL },
        );
        const finalHtml = await addAssetRefs(html);
        await writeFile(join(outDir, `${fname}.html`), finalHtml, 'utf-8');
        count++;
    }

    console.log(`  ${category}: ${count} pages`);
    return count;
}

export async function dialog() {
    const template = await readFile(TPL, 'utf-8');

    console.log('\nGenerating er pages...');
    const erCount = await renderPages(template, 'er', 'er');
    console.log(`Er pages: ${erCount} total.`);

    console.log('\nGenerating main1 pages...');
    const main1Count = await renderPages(template, 'main1', 'mainline/1');

    console.log('\nGenerating main2 pages...');
    const main2Count = await renderPages(template, 'main2', 'mainline/2');

    const total = main1Count + main2Count;
    console.log(`Dialog pages: ${total} total (main1+main2), ${erCount} er.`);
}
