import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_UNITS = ['', '十', '百', '千'];

export function toCnText(n) {
    if (n < 10) return CN_DIGITS[n];
    if (n === 10) return '十';
    const q = Math.floor(n / 10);
    const r = n % 10;
    if (q === 1) return '十' + (r > 0 ? CN_DIGITS[r] : '');
    return CN_DIGITS[q] + '十' + (r > 0 ? CN_DIGITS[r] : '');
}

export function toChapterNumber(ch) {
    const n = Number(ch) % 100;
    if (isNaN(n)) return String(ch);
    const a = Math.floor(n);
    const b = Math.round(10 * (n - a));
    let s = '第' + toCnText(a) + '章';
    if (b > 0) {
        s += '间章';
        if (b > 1 && b !== 5) s += b;
    }
    return s;
}

export const MARS_STAGE_NUMBER_MAP = {
    1.5: '虚影的宴舞',
    3.5: '一个梦游者的苦痛',
    7.5: '神明无处祈祷',
    9.5: '星星仍在闪烁',
    11.5: '光所梦寻之夜',
};

export const DOMAIN_LABELS = {
    main: '主线第一部',
    main2: '主线第二部',
    ow: '开放世界',
    ex: '编年史',
    novel: '小说',
};

export const SITE_BASE = 'https://www.bh3text.com';

export const DOMAIN_URL_MAP = {
    main: 'mainline/1',
    main2: 'mainline/2',
    er: 'er',
    ow: 'ow',
    ex: 'ex',
    novel: 'novel',
};

// ---- Asset cache busting via SHA256 ----

const _refCache = new Map();

export async function addAssetRefs(html) {
    const ROOT = join(__dirname, '..');
    const re = /(href|src)="(\/_r\/[^"]+)"/g;
    const matches = [...html.matchAll(re)];
    const urls = [...new Set(matches.map((m) => m[2]))];

    for (const url of urls) {
        if (!_refCache.has(url)) {
            const content = await readFile(join(ROOT, 'dist', url));
            const hash = createHash('sha256').update(content).digest('hex');
            _refCache.set(url, url + '?ref=' + hash);
        }
    }

    return html.replace(re, (m, attr, url) => `${attr}="${_refCache.get(url)}"`);
}

// ---- Er chapter list from data/dist/basic/basic.js ----

let _erChapters = null;
export async function getErChapters() {
    if (_erChapters) return _erChapters;
    const data = new Function('let Util;' + (await readFile(join(__dirname, '..', 'data', 'dist', 'basic', 'basic.js'), 'utf-8')) + ';return GameRogueData')();
    _erChapters = Object.entries(data).map(([ch, v]) => ({
        chapter: ch,
        title: v.title,
    }));
    return _erChapters;
}

// ---- Text markup processing ----

const PLACEHOLDERS = {
    PJMS_NICKNAME: '<span class="dialog-nickname" data-custom-name="PJMS_NICKNAME">寻梦者</span>',
    PJMS_FIRSTSET_NICKNAME: '<span class="dialog-nickname" data-custom-name="PJMS_FIRSTSET_NICKNAME">寻梦者</span>',
    NICKNAME: '<span class="dialog-nickname" data-custom-name="NICKNAME">舰长</span>',
    DLC_NICKNAME: '<span class="dialog-nickname" data-custom-name="DLC_NICKNAME">队员</span>',
    DLC2_NICKNAME: '<span class="dialog-nickname" data-custom-name="DLC2_NICKNAME">队员</span>',
};

function procColorTag(_, c, content) {
    c = c.toLowerCase();
    if (c === '#ffffffff' || c === '#fff' || c === '#fffff' || c === '#fffffff' || c === '#ffffff') return '<span style="color:#fff">';
    if (c === '#000000') return '<span style="color:#000">';
    let alpha = 1;
    if (c.startsWith('#') && c.length === 10) {
        alpha = parseInt(c.substring(8), 16) / 255;
        c = c.substring(0, 7);
    }
    if (alpha < 1) return `<span style="color:${c};opacity:${alpha.toFixed(2)}">${content}</span>`;
    return `<span style="color:${c}">${content}</span>`;
}

export function publicUrlFromPath(inputPath) {
    let p = String(inputPath || '').replace(/\\/g, '/');

    if (!p.startsWith('/')) p = '/' + p;

    if (p.endsWith('/index.html')) {
        p = p.slice(0, -'index.html'.length);
    } else if (p.endsWith('.html')) {
        p = p.slice(0, -'.html'.length);
    }

    return p || '/';
}
