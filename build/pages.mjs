import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import {
    SITE_BASE,
    toChapterNumber,
    MARS_STAGE_NUMBER_MAP,
    DOMAIN_LABELS,
    DOMAIN_URL_MAP,
    getErChapters,
    addAssetRefs,
    publicUrlFromPath,
} from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data/dist/app');
const DIST_DIR = join(ROOT, 'dist');
const STAGE_ORDER = ['Main', 'Companion', 'Celebrition', 'Branch', 'Entrust'];
const STAGE_RANK = Object.fromEntries(STAGE_ORDER.map((k, i) => [k.toLowerCase(), i]));

async function loadJSON(p) {
    return JSON.parse(await readFile(p, 'utf-8'));
}

function chapterLabel(ch) {
    const n = String(ch.chapter);
    if (MARS_STAGE_NUMBER_MAP[n]) return MARS_STAGE_NUMBER_MAP[n];
    return toChapterNumber(n);
}

function chapterFullLabel(ch) {
    if (String(ch.chapter) === '43') return ch.title;
    const cn = chapterLabel(ch);
    if (String(ch.chapter).includes('.5') && MARS_STAGE_NUMBER_MAP[String(ch.chapter)]) {
        return `梦间拾集 ${cn}`;
    }
    return `${cn} ${ch.title}`;
}

export async function pages() {
    const tplHome = await readFile(join(ROOT, 'page/home.ejs'), 'utf-8');
    const tplDialog = await readFile(join(ROOT, 'page/dialog-index.ejs'), 'utf-8');
    const tplChapter = await readFile(join(ROOT, 'page/chapter-index.ejs'), 'utf-8');

    // ======== 1. Home page ========
    const modules = [
        { name: '对话', url: '/dialog/', desc: '对话文本' },
        // { name: '文献', url: '/bh3/documents/', desc: '游戏内文献资料' },
        // { name: '便签', url: '/bh3/notes/', desc: '便签与笔记' },
        // { name: '收藏', url: '/bh3/collection/', desc: '收藏品展示' },
    ];
    let html;
    html = ejs.render(tplHome, { modules }, { filename: join(ROOT, 'page/home.ejs') });
    html = await addAssetRefs(html);
    await writeFile(join(DIST_DIR, 'index.html'), html, 'utf-8');
    console.log('  Home page generated.');

    // ======== 2. Dialog index ========
    const sections = [];
    for (const [typeKey, label] of Object.entries(DOMAIN_LABELS)) {
        const fn = typeKey === 'main' ? 'main.json'
            : typeKey === 'main2' ? 'main2.json' : null;
        if (!fn) continue;
        const idx = await loadJSON(join(DATA_DIR, 'index', fn));
        const urlDir = DOMAIN_URL_MAP[typeKey];
        const groups = [];
        let arcIdx = 0;
        for (const [arcName, chapters] of Object.entries(idx)) {
            if (typeKey === 'main' && arcIdx === 10) {
                const erCh = await getErChapters();
                groups.push({
                    heading: '往世乐土',
                    items: erCh.map((ch) => ({
                        url: `/dialog/er/${ch.chapter}/`,
                        label: ch.title,
                    })),
                });
            }
            groups.push({
                heading: arcName,
                items: chapters.map((ch) => ({
                    url: `/dialog/${urlDir}/${ch.chapter}/`,
                    label: chapterFullLabel(ch),
                })),
            });
            arcIdx++;
        }
        sections.push({ label, groups });
    }
    await mkdir(join(DIST_DIR, 'dialog'), { recursive: true });
    html = ejs.render(tplDialog, { sections }, { filename: join(ROOT, 'page/dialog-index.ejs') });
    html = await addAssetRefs(html);
    await writeFile(join(DIST_DIR, 'dialog/index.html'), html, 'utf-8');
    console.log('  Dialog index page generated.');

    // ======== 3. Chapter index pages ========
    for (const [typeKey, urlDir] of Object.entries(DOMAIN_URL_MAP)) {
        if (typeKey !== 'main' && typeKey !== 'main2') continue;
        const fn = typeKey === 'main' ? 'main.json' : 'main2.json';
        const idx = await loadJSON(join(DATA_DIR, 'index', fn));

        for (const [arcName, chapters] of Object.entries(idx)) {
            for (const ch of chapters) {
                const outDir = join(DIST_DIR, 'dialog', urlDir, String(ch.chapter));

                // 从数据文件获取正确顺序，不依赖文件系统排序
                const items = [];
                const chDataPath = typeKey === 'main'
                    ? join(DATA_DIR, 'chapters/data', `${ch.chapter}.json`)
                    : join(DATA_DIR, 'chapters/data',
                        `${100 + Math.floor(Number(ch.chapter))}${String(ch.chapter).includes('.5') ? '_5' : ''}.json`);
                let chData;
                try { chData = await loadJSON(chDataPath); } catch { chData = null; }

                if (chData) {
                    if (typeKey === 'main') {
                        // main1: stages 是数组，顺序即正确顺序
                        for (const act of chData.stages || []) {
                            for (const sec of act.data || []) {
                                items.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${sec.displayName}`,
                                    label: `${sec.displayName} ${sec.displayTitle || ''}`,
                                });
                            }
                        }
                        // 补充未在 stages 中出现的 content
                        const used = new Set();
                        for (const act of chData.stages || [])
                            for (const sec of act.data || [])
                                used.add(sec.displayName);
                        for (const ci of chData.content || []) {
                            if (!used.has(ci.id) && ci.dialogs) {
                                items.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${ci.id}`,
                                    label: ci.id,
                                });
                            }
                        }
                    } else {
                        // main2: stages 是 dict，按 STAGE_ORDER 遍历
                        const to = ['Main', 'Companion', 'Celebrition', 'Branch', 'Entrust'];
                        for (const cat of to) {
                            const stageItems = chData.stages?.[cat];
                            if (!stageItems) continue;
                            let idx = 0;
                            for (const si of stageItems) {
                                idx++;
                                const info = si.info || {};
                                if (!info.id) continue;
                                // 检查是否有对应的 content
                                const hasContent = (chData.content || []).some(
                                    ci => ci.series === info.id && ci.dialogs?.length);
                                if (!hasContent) continue;
                                items.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${cat.toLowerCase()}${idx}`,
                                    label: info.Title || `${cat}${idx}`,
                                });
                            }
                        }
                    }
                }

                html = ejs.render(tplChapter, {
                    title: chapterFullLabel(ch), items,
                    canonicalUrl: SITE_BASE + `/dialog/${urlDir}/${ch.chapter}/`,
                }, { filename: join(ROOT, 'page/chapter-index.ejs') });
                html = await addAssetRefs(html);
                await writeFile(join(outDir, 'index.html'), html, 'utf-8');
            }
        }
    }
    console.log('  Chapter index pages generated.');

    // ======== 4. Er chapter index pages ========
    const erIdx = await loadJSON(join(ROOT, 'data/dist/dialog/index/er.json'));
    for (const ch of (await getErChapters())) {
        const stages = erIdx[ch.chapter] || [];
        const items = stages.map((s) => ({
            url: `/dialog/er/${ch.chapter}/${encodeURIComponent(s.id)}`,
            label: s.id,
        }));
        html = ejs.render(tplChapter, {
            title: ch.title, items,
            canonicalUrl: SITE_BASE + `/dialog/er/${ch.chapter}/`,
        }, { filename: join(ROOT, 'page/chapter-index.ejs') });
        html = await addAssetRefs(html);
        await writeFile(join(DIST_DIR, 'dialog', 'er', ch.chapter, 'index.html'), html, 'utf-8');
    }
    console.log('  Er chapter index pages generated.');
}
