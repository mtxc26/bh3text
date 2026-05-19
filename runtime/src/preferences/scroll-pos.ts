import { hasConsent } from '@/consent/manager';
import { db } from '@/data';
import { debounce } from 'lodash-es';

interface ScrollPosEntry {
    /** 锚点元素的 id */
    id: string;
    /** window.scrollY - elementAbsoluteTop，即视口顶部相对于该元素顶部的偏移 */
    offset: number;
}

const getNormUrl = (url: URL | string) => {
    const u = new URL(url, window.location.href);
    u.hash = '';
    return u.href;
};

async function scrollPosEnabled() {
    if (!(await hasConsent('f'))) return false;
    if ((await db.get('config', 'user.pref.state.scroll_pos_restore')) === false) return false;
    return true;
}

/**
 * 寻找离当前视口最近的有 id 的元素。
 * - 若元素在视口内，距离 = 元素顶部到视口中部的距离
 * - 若元素在视口上方，距离 = 视口顶部 - 元素底部
 * - 若元素在视口下方，距离 = 元素顶部 - 视口底部
 *
 * 返回该元素的 id 以及 offset（scrollY 相对于该元素绝对顶部的偏移）。
 * 若页面没有任何带 id 的元素则返回 null。
 */
function findNearestIdElement(): { id: string; offset: number } | null {
    const allElements = document.querySelectorAll('[id]');
    if (allElements.length === 0) return null;

    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const viewportCenter = viewportTop + window.innerHeight / 2;

    let bestElement: Element | null = null;
    let bestDistance = Infinity;

    for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        const elTop = rect.top + viewportTop;
        const elBottom = rect.bottom + viewportTop;

        let distance: number;
        if (elBottom < viewportTop) {
            // 元素在视口上方
            distance = viewportTop - elBottom;
        } else if (elTop > viewportBottom) {
            // 元素在视口下方
            distance = elTop - viewportBottom;
        } else {
            // 元素在视口内：取元素顶部到视口中部的距离
            distance = Math.abs(elTop - viewportCenter);
        }

        if (distance < bestDistance) {
            bestDistance = distance;
            bestElement = el;
        }
    }

    if (!bestElement) return null;

    const elTop = bestElement.getBoundingClientRect().top + viewportTop;
    return {
        id: bestElement.id,
        offset: window.scrollY - elTop,
    };
}

export async function GetScrollPosData() {
    if (!(await scrollPosEnabled())) return null;
    return ((await db.get('pref', 'app.history.scroll_pos')) as Record<string, ScrollPosEntry | number>) ?? null;
}

export async function GetScrollPosForPage(url: string): Promise<ScrollPosEntry | null> {
    const data = await GetScrollPosData();
    if (!data) return null;
    const raw = data[getNormUrl(url)];
    // 兼容旧格式（纯数字），旧数据直接丢弃
    if (typeof raw === 'number') return null;
    return raw ?? null;
}

export async function SetScrollPosForPage(url: string, entry: ScrollPosEntry) {
    if (!(await scrollPosEnabled())) return;
    const data = (await GetScrollPosData()) ?? {};
    data[getNormUrl(url)] = entry;
    await db.put('pref', data, 'app.history.scroll_pos');
}

export async function RestoreScrollPos() {
    if (!(await scrollPosEnabled())) return;
    const entry = await GetScrollPosForPage(window.location.href);
    if (!entry) return;

    const anchor = document.getElementById(entry.id);
    if (!anchor) return; // 锚点元素不存在，不恢复

    const targetY = anchor.getBoundingClientRect().top + window.scrollY + entry.offset;
    window.scrollTo(0, targetY);
}

export async function setupScrollPosTracking() {
    const save = debounce(() => {
        const loc = window.location;
        if (loc.pathname.startsWith('/dialog/') && loc.pathname.length > 8) {
            const entry = findNearestIdElement();
            if (entry) {
                SetScrollPosForPage(loc.href, entry);
            }
        }
    }, 50);
    window.addEventListener('scroll', save, { passive: true });
}
