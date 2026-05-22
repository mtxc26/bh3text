import { hasConsent } from '@/consent/manager';
import { getSettings } from '@/settings';
import { db } from '@/data';
import { debounce } from 'lodash-es';

interface ScrollPosEntry {
    id: string;
    offset: number;
}

const getNormUrl = (url: URL | string) => {
    const u = new URL(url, window.location.href);
    u.hash = '';
    return u.href;
};

async function scrollPosEnabled() {
    if (!(await hasConsent('f'))) return false;
    if (!(await getSettings('user.pref.state.scroll_pos_restore'))) return false;
    return true;
}

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
            distance = viewportTop - elBottom;
        } else if (elTop > viewportBottom) {
            distance = elTop - viewportBottom;
        } else {
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
    if (location.hash && location.hash !== '#') return; // already has hash positioning
    const entry = await GetScrollPosForPage(window.location.href);
    if (!entry) return;

    const anchor = document.getElementById(entry.id);
    if (!anchor) return;

    const targetY = anchor.getBoundingClientRect().top + window.scrollY + entry.offset;
    window.scrollTo(0, targetY);
}

export async function setupScrollPosTracking() {
    const save = debounce(() => {
        const loc = window.location;
        if (/\/(dialog)\//.test(loc.pathname)) {
            const entry = findNearestIdElement();
            if (entry) {
                SetScrollPosForPage(loc.href, entry);
            }
        }
    }, 50);
    window.addEventListener('scroll', save, { passive: true });
}
