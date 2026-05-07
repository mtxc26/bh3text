import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import { DOMAIN_URL_MAP, SITE_BASE, procText, addAssetRefs } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_APP = join(ROOT, 'data/dist/app');
const DIST_DIR = join(ROOT, 'dist/dialog');
const TPL = join(ROOT, 'page/dialog.ejs');

async function loadJSON(p) {
    return JSON.parse(await readFile(p, 'utf-8'));
}

// ---- Process a single content item's dialogs into structured blocks ----

function processDialogs(dialogs) {
    const blocks = [];
    for (const dlg of dialogs || []) {
        // Step directive
        if (dlg.text) {
            const m = dlg.text.match(/<step>(.*?)<\/step>/);
            blocks.push({ step: m ? m[1] : dlg.text });
            continue;
        }
        // Dialog lines - may contain CG items inline
        if (dlg.lines) {
            let block = { lines: [] };
            if (dlg.synopsis) block.synopsis = dlg.synopsis;
            for (const ln of dlg.lines) {
                if (ln.type === 'CG') {
                    // Split CG into its own block
                    if (block.lines.length) {
                        blocks.push(block);
                        blocks.push({ type: 'CG', cg: ln.cg });
                        const newBlock = { lines: [] };
                        if (dlg.synopsis) newBlock.synopsis = dlg.synopsis;
                        block = newBlock;
                    } else {
                        blocks.push({ type: 'CG', cg: ln.cg });
                    }
                } else {
                    block.lines.push({
                        actor: procText(ln.actor || ''),
                        content: procText(
                            Array.isArray(ln.content)
                                ? ln.content.join('')
                                : (ln.content || '')
                        ),
                    });
                }
            }
            if (block.lines.length) blocks.push(block);
        }
    }
    return blocks;
}

// ---- Main1: list-style stages ----

function processMain1(stages, content) {
    const contentMap = new Map(content.map(c => [c.id, c]));
    const used = new Set();
    const result = [];

    for (const act of stages || []) {
        const actName = act.actData?.actName || '';
        for (const sec of act.data || []) {
            const ci = contentMap.get(sec.displayName);
            if (!ci) continue;
            used.add(ci.id);
            result.push({
                displayName: sec.displayName,
                contentId: ci.id,
                title: sec.displayTitle || '',
                desc: sec.displayDetail || '',
                actName,
                blocks: processDialogs(ci.dialogs),
            });
        }
    }

    // Append unmatched content
    for (const ci of content) {
        if (!used.has(ci.id) && ci.dialogs) {
            result.push({
                displayName: ci.id,
                contentId: ci.id,
                title: ci.id,
                desc: '',
                actName: '',
                blocks: processDialogs(ci.dialogs),
            });
        }
    }
    return result;
}

// ---- Main2: dict-style stages ----

const STAGE_ORDER = ['Main', 'Companion', 'Celebrition', 'Branch', 'Entrust'];

function processMain2(stages, content) {
    // Map series → content items, sorted by story
    const seriesMap = new Map();
    for (const ci of content) {
        if (ci.series == null) continue;
        if (!seriesMap.has(ci.series)) seriesMap.set(ci.series, []);
        seriesMap.get(ci.series).push(ci);
    }
    for (const items of seriesMap.values()) {
        items.sort((a, b) => (a.story || 0) - (b.story || 0));
    }

    const result = [];
    for (const cat of STAGE_ORDER) {
        const items = stages[cat];
        if (!items) continue;
        let idx = 0;
        for (const item of items) {
            const info = item.info || {};
            const matched = seriesMap.get(info.id) || [];
            if (!matched.length) continue;
            idx++;
            const blocks = [];
            for (const ci of matched) {
                blocks.push(...processDialogs(ci.dialogs));
            }
            if (!blocks.length) continue;
            result.push({
                type: cat,
                index: idx,
                title: info.Title || '',
                desc: info.Desc || '',
                blocks,
            });
        }
    }
    return result;
}

// ---- ER pages ----

async function buildEr(template) {
    const idx = await loadJSON(join(ROOT, 'data/dist/dialog/index/er.json'));
    let total = 0;

    for (const [chNum, stages] of Object.entries(idx)) {
        // Load ER dialog data
        let dialogData = {};
        try {
            dialogData = await loadJSON(join(ROOT, 'data/dist/dialog/data/er', `${chNum}.json`));
        } catch {
            try {
                dialogData = await loadJSON(join(ROOT, 'data/dist/dialog/data/er/0.json'));
            } catch { /* ignore */ }
        }

        for (const stage of stages) {
            const blocks = [];
            for (const item of stage.data) {
                if (typeof item === 'string') {
                    const lines = dialogData[item];
                    if (lines) {
                        blocks.push({
                            lines: lines.map(ln => ({
                                actor: procText(ln.actor || ''),
                                content: procText(Array.isArray(ln.content)
                                    ? ln.content.join('')
                                    : (ln.content || '')),
                            })),
                        });
                    }
                } else if (Array.isArray(item) && item.length > 0) {
                    if (typeof item[0] === 'string' && item[0].startsWith('<step>')) {
                        blocks.push({ step: item[0].replace(/<\/?step>/g, '') });
                    }
                }
            }

            if (!blocks.length) continue;
            stage._blocks = blocks;
            stage._hasContent = true;
        }

        // Second pass: render with prev/next navigation
        const validStages = stages.filter(s => s._hasContent);
        for (let i = 0; i < validStages.length; i++) {
            const stage = validStages[i];
            const blocks = stage._blocks;
            const outDir = join(DIST_DIR, 'er', chNum);
            await mkdir(outDir, { recursive: true });
            const erUrl = `/dialog/er/${chNum}/${encodeURIComponent(stage.id)}.html`;
            let html = ejs.render(template, {
                title: stage.id,
                stageTitle: stage.id,
                canonicalUrl: SITE_BASE + erUrl,
                desc: '',
                dialogs: blocks,
                up: `/dialog/er/${chNum}/`,
                prev: i > 0 ? { url: `/dialog/er/${chNum}/${encodeURIComponent(validStages[i-1].id)}.html`, title: validStages[i-1].id } : null,
                next: i < validStages.length - 1 ? { url: `/dialog/er/${chNum}/${encodeURIComponent(validStages[i+1].id)}.html`, title: validStages[i+1].id } : null,
            }, { filename: TPL });
            html = await addAssetRefs(html);
            await writeFile(join(outDir, `${stage.id}.html`), html, 'utf-8');
            total++;
        }
        console.log(`  er/${chNum}: ${stages.length} stages → ${total} pages so far`);
    }
    return total;
}

// ---- Filename helper ----

function filename(page, cat) {
    if (page.contentId) return `${page.contentId}.html`;
    if (page.displayName) return `${page.displayName}.html`;
    return `${(cat || page.type || '').toLowerCase()}${page.index || ''}.html`;
}

// ----
export async function dialog() {
    const template = await readFile(TPL, 'utf-8');

    // ==== Er ====
    console.log('\nGenerating er pages...');
    const erTotal = await buildEr(template);
    console.log(`Er pages: ${erTotal} total.`);

    // ==== Main1 + Main2 ====
    const configs = [
        { file: 'main.json', typeKey: 'main', processor: processMain1 },
        { file: 'main2.json', typeKey: 'main2', processor: processMain2 },
    ];

    let total = 0;
    for (const cfg of configs) {
        const idx = await loadJSON(join(DATA_APP, 'index', cfg.file));
        const urlDir = DOMAIN_URL_MAP[cfg.typeKey];

        // Flatten chapters from index
        const chapters = [];
        for (const [, list] of Object.entries(idx)) {
            for (const ch of list) chapters.push(ch);
        }

        for (const ch of chapters) {
            let chData;
            const chFile = cfg.typeKey === 'main2'
                ? `${100 + Math.floor(Number(ch.chapter))}${String(ch.chapter).includes('.5') ? '_5' : ''}.json`
                : `${ch.chapter}.json`;
            try {
                chData = await loadJSON(join(DATA_APP, 'chapters/data', chFile));
            } catch { continue; }

            const pages = cfg.processor(chData.stages, chData.content || []);

            const validPages = pages.filter(pg => pg.blocks && pg.blocks.length);
            for (let i = 0; i < validPages.length; i++) {
                const pg = validPages[i];
                const outDir = join(DIST_DIR, urlDir, String(ch.chapter));
                await mkdir(outDir, { recursive: true });

                const stageTitle = pg.title || pg.actName || pg.displayName || '';
                const dn = pg.contentId || pg.displayName || '';
                const pageTitle = dn ? `${dn} ${stageTitle}` : stageTitle;

                const prevPg = i > 0 ? validPages[i-1] : null;
                const nextPg = i < validPages.length - 1 ? validPages[i+1] : null;
                const prevTitle = prevPg ? (prevPg.title || prevPg.actName || prevPg.displayName || '') : '';
                const nextTitle = nextPg ? (nextPg.title || nextPg.actName || nextPg.displayName || '') : '';

                const pagePath = `/dialog/${urlDir}/${ch.chapter}/${filename(pg)}`;
                let html = ejs.render(template, {
                    title: pageTitle || ch.title,
                    stageTitle: pageTitle,
                    canonicalUrl: SITE_BASE + pagePath,
                    desc: pg.desc || '',
                    dialogs: pg.blocks,
                    up: `/dialog/${urlDir}/${ch.chapter}/`,
                    prev: prevPg ? { url: `/dialog/${urlDir}/${ch.chapter}/${filename(prevPg)}`, title: prevTitle } : null,
                    next: nextPg ? { url: `/dialog/${urlDir}/${ch.chapter}/${filename(nextPg)}`, title: nextTitle } : null,
                }, { filename: TPL });
                html = await addAssetRefs(html);
                await writeFile(join(outDir, filename(pg)), html, 'utf-8');
                total++;
            }
            console.log(`  ${urlDir}/${ch.chapter}: ${pages.length} pages`);
        }
    }
    console.log(`Dialog pages: ${total} total (main1+main2), ${erTotal} er.`);
}
