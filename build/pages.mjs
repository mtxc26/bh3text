import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import { SITE_BASE, toChapterNumber, MARS_STAGE_NUMBER_MAP, DOMAIN_LABELS, DOMAIN_URL_MAP, getErChapters, addAssetRefs, publicUrlFromPath } from './util.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data/dist/app');
const DIST_DIR = join(ROOT, 'dist');
const STAGE_ORDER = ['Main', 'Companion', 'Celebrition', 'Branch', 'Entrust'];
const STAGE_RANK = Object.fromEntries(STAGE_ORDER.map((k, i) => [k.toLowerCase(), i]));
const CAT_LABEL = {
    Main: '主线',
    Companion: '梦间拾集',
    Celebrition: '巡游庆典',
    Branch: '支线',
    Entrust: '委托',
};

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
        { id: 'home_LastRead', name: '上次阅读', url: '/', desc: '暂时没有上次阅读记录' },
        { name: '主线', url: '/dialog/', desc: '主线对话文本' },
        { name: '往世乐土', url: '/dialog/#group-main-10', desc: '往世乐土对话文本' },
    ];
    let html;
    html = ejs.render(tplHome, { modules }, { rmWhitespace: true, filename: join(ROOT, 'page/home.ejs') });
    html = await addAssetRefs(html);
    await writeFile(join(DIST_DIR, 'index.html'), html, 'utf-8');
    console.log('  Home page generated.');

    // ======== 2. Dialog index ========
    const sections = [];
    for (const [typeKey, label] of Object.entries(DOMAIN_LABELS)) {
        const fn = typeKey === 'main' ? 'main.json' : typeKey === 'main2' ? 'main2.json' : null;
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
                        chapter: ch.chapter,
                    })),
                });
            }
            groups.push({
                heading: arcName,
                items: chapters.map((ch) => ({
                    url: `/dialog/${urlDir}/${ch.chapter}/`,
                    label: chapterFullLabel(ch),
                    chapter: ch.chapter,
                })),
            });
            arcIdx++;
        }
        sections.push({ typeKey, label, groups });
    }
    await mkdir(join(DIST_DIR, 'dialog'), { recursive: true });
    html = ejs.render(tplDialog, { sections }, { rmWhitespace: true, filename: join(ROOT, 'page/dialog-index.ejs') });
    html = await addAssetRefs(html);
    await writeFile(join(DIST_DIR, 'dialog/index.html'), html, 'utf-8');
    console.log('  Dialog index page generated.');

    // ======== 3. Chapter index pages ========
    // 加载 pages JSON 作为页面是否存在的权威来源
    const pagesMain1 = await loadJSON(join(ROOT, 'data/dist/pages/main1.json'));
    const pagesMain2 = await loadJSON(join(ROOT, 'data/dist/pages/main2.json'));

    // 构建 chapter -> Set<pageId> 映射 (pageId 已 URL 解码)
    function buildValidPages(pagesList) {
        const map = new Map();
        for (const pg of pagesList) {
            const c = pg.c;
            if (!map.has(c)) map.set(c, new Set());
            const lastSeg = pg.u.split('/').pop();
            map.get(c).add(decodeURIComponent(lastSeg));
        }
        return map;
    }
    const validMain1 = buildValidPages(pagesMain1);
    const validMain2 = buildValidPages(pagesMain2);

    // Build flat ordered chapter list for prev/next links
    const allChapters = []; // { typeKey, urlDir, chapter, title, idx, arcName }
    for (const [typeKey, urlDir] of Object.entries(DOMAIN_URL_MAP)) {
        if (typeKey !== 'main' && typeKey !== 'main2') continue;
        const fn = typeKey === 'main' ? 'main.json' : 'main2.json';
        const idx = await loadJSON(join(DATA_DIR, 'index', fn));
        for (const [arcName, chapters] of Object.entries(idx)) {
            for (const ch of chapters) {
                allChapters.push({
                    typeKey, urlDir,
                    chapter: String(ch.chapter),
                    title: chapterFullLabel(ch),
                    idx, arcName, ch,
                });
            }
        }
    }

    for (const [typeKey, urlDir] of Object.entries(DOMAIN_URL_MAP)) {
        if (typeKey !== 'main' && typeKey !== 'main2') continue;
        const fn = typeKey === 'main' ? 'main.json' : 'main2.json';
        const idx = await loadJSON(join(DATA_DIR, 'index', fn));
        const validPages = typeKey === 'main' ? validMain1 : validMain2;

        for (const [arcName, chapters] of Object.entries(idx)) {
            for (const ch of chapters) {
                const outDir = join(DIST_DIR, 'dialog', urlDir, String(ch.chapter));

                const chDataPath = typeKey === 'main' ? join(DATA_DIR, 'chapters/data', `${ch.chapter}.json`) : join(DATA_DIR, 'chapters/data', `${100 + Math.floor(Number(ch.chapter))}${String(ch.chapter).includes('.5') ? '_5' : ''}.json`);
                let chData;
                try {
                    chData = await loadJSON(chDataPath);
                } catch {
                    chData = null;
                }

                const vp = validPages.get(String(ch.chapter)) || new Set();

                let groups;
                if (chData && vp.size > 0) {
                    if (typeKey === 'main') {
                        // Build owTitle fallback map from chapter data content
                        const contentOwTitle = new Map();
                        for (const ci of chData.content || []) {
                            if (ci.owTitle) contentOwTitle.set(ci.id, ci.owTitle);
                        }
                        // Build stage-data order: [ {pid, title, actName}, ... ]
                        const stageOrder = [];
                        const stageTitleMap = new Map();
                        for (const act of chData.stages || []) {
                            for (const sec of act.data || []) {
                                if (!sec.displayName) continue;
                                if (!vp.has(sec.displayName)) continue;
                                stageOrder.push(sec.displayName);
                                stageTitleMap.set(sec.displayName, {
                                    title: sec.displayTitle || '',
                                    actName: act.actData?.actName || '',
                                });
                            }
                        }
                        // Content order from pages JSON (dialog index order)
                        const contentOrder = [];
                        const contentSet = new Set();
                        for (const pid of vp) {
                            contentOrder.push(pid);
                            contentSet.add(pid);
                        }
                        // Check if stage order matches content order (ignoring entries not in stage data)
                        const stageOnly = stageOrder.filter(p => contentSet.has(p));
                        const contentOnlyInStage = contentOrder.filter(p => stageOrder.includes(p));
                        const orderMatches = stageOnly.length === contentOnlyInStage.length &&
                            stageOnly.every((p, i) => p === contentOnlyInStage[i]);
                        // Only use grouped display when ALL items are in stage data AND order matches
                        const allInStage = contentOrder.every(p => stageOrder.includes(p));

                        if (orderMatches && stageOrder.length > 0 && allInStage) {
                            // Use grouped display
                            groups = [];
                            const used = new Set();
                            for (const act of chData.stages || []) {
                                const groupItems = [];
                                for (const sec of act.data || []) {
                                    if (!sec.displayName) continue;
                                    if (!vp.has(sec.displayName)) continue;
                                    used.add(sec.displayName);
                                    const t = stageTitleMap.get(sec.displayName);
                                    groupItems.push({
                                        url: `/dialog/${urlDir}/${ch.chapter}/${encodeURIComponent(sec.displayName)}`,
                                        label: `${sec.displayName} ${t.title}`,
                                    });
                                }
                                if (groupItems.length)
                                    groups.push({
                                        heading: act.actData?.actName || '',
                                        items: groupItems,
                                    });
                            }
                            // Extra items not in stage data
                            const extraItems = [];
                            for (const pid of contentOrder) {
                                if (!used.has(pid)) {
                                    const ow = contentOwTitle.get(pid);
                                    extraItems.push({
                                        url: `/dialog/${urlDir}/${ch.chapter}/${encodeURIComponent(pid)}`,
                                        label: ow ? `${pid} ${ow}` : pid,
                                    });
                                }
                            }
                            if (extraItems.length)
                                groups.push({ heading: '其他', items: extraItems });
                        } else {
                            // Flat list in content order
                            groups = [];
                            const items = [];
                            for (const pid of contentOrder) {
                                const t = stageTitleMap.get(pid);
                                const ow = contentOwTitle.get(pid);
                                const label = t && t.title ? `${pid} ${t.title}` : (ow ? `${pid} ${ow}` : pid);
                                items.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${encodeURIComponent(pid)}`,
                                    label,
                                });
                            }
                            if (items.length)
                                groups.push({ heading: '', items });
                        }
                    } else {
                        // main2: stages 是 dict，按 STAGE_ORDER 分组
                        groups = [];
                        const used = new Set();
                        for (const cat of STAGE_ORDER) {
                            const stageItems = chData.stages?.[cat];
                            if (!stageItems) continue;
                            const groupItems = [];
                            let catIdx = 0;
                            for (const si of stageItems) {
                                catIdx++;
                                const info = si.info || {};
                                if (!info.id) continue;
                                const expectedId = `${cat.toLowerCase()}${catIdx}`;
                                if (!vp.has(expectedId)) continue;
                                used.add(expectedId);
                                groupItems.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${expectedId}`,
                                    label: info.Title || expectedId,
                                });
                            }
                            if (groupItems.length) groups.push({ heading: CAT_LABEL[cat] || cat, items: groupItems });
                        }
                        // 补充未覆盖的页面
                        const extraItems = [];
                        for (const pid of vp) {
                            if (!used.has(pid))
                                extraItems.push({
                                    url: `/dialog/${urlDir}/${ch.chapter}/${encodeURIComponent(pid)}`,
                                    label: pid,
                                });
                        }
                        if (extraItems.length)
                            groups.push({
                                heading: groups.length === 0 ? '' : '其他',
                                items: extraItems,
                            });
                    }
                } else {
                    groups = [];
                }

                const title = chapterFullLabel(ch);
                // Find prev/next chapter in flat list
                const myIdx = allChapters.findIndex(ac => ac.typeKey === typeKey && ac.chapter === String(ch.chapter));
                const prevCh = myIdx > 0 ? allChapters[myIdx - 1] : null;
                const nextCh = myIdx < allChapters.length - 1 ? allChapters[myIdx + 1] : null;
                html = ejs.render(
                    tplChapter,
                    {
                        title,
                        titleB64: Buffer.from(title).toString('base64'),
                        groups,
                        canonicalUrl: SITE_BASE + `/dialog/${urlDir}/${ch.chapter}/`,
                        prevChapter: prevCh ? { url: `/dialog/${prevCh.urlDir}/${prevCh.chapter}/`, title: prevCh.title } : null,
                        nextChapter: nextCh ? { url: `/dialog/${nextCh.urlDir}/${nextCh.chapter}/`, title: nextCh.title } : null,
                    },
                    { rmWhitespace: true, filename: join(ROOT, 'page/chapter-index.ejs') },
                );
                html = await addAssetRefs(html);
                await writeFile(join(outDir, 'index.html'), html, 'utf-8');
            }
        }
    }
    console.log('  Chapter index pages generated.');

    // ======== 4. Er chapter index pages ========
    const erIdx = await loadJSON(join(ROOT, 'data/dist/dialog/index/er.json'));
    for (const ch of await getErChapters()) {
        const stages = erIdx[ch.chapter] || [];
        const items = stages.map((s) => ({
            url: `/dialog/er/${ch.chapter}/${encodeURIComponent(s.id)}`,
            label: s.id,
        }));
        const title = ch.title;
        html = ejs.render(
            tplChapter,
            {
                title,
                titleB64: Buffer.from(title).toString('base64'),
                groups: [{ heading: '', items }],
                canonicalUrl: SITE_BASE + `/dialog/er/${ch.chapter}/`,
            },
            { rmWhitespace: true, filename: join(ROOT, 'page/chapter-index.ejs') },
        );
        html = await addAssetRefs(html);
        await writeFile(join(DIST_DIR, 'dialog', 'er', ch.chapter, 'index.html'), html, 'utf-8');
    }
    console.log('  Er chapter index pages generated.');
}
