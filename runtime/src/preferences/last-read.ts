import { hasConsent } from '@/consent/manager';
import { db } from '@/data';
import router from '@/router';

export async function GetLastRead() {
    if (!(await hasConsent('f'))) return null;
    return ((await db.get('pref', 'app.history.last_read_page')) as { url: string; title: string }) ?? null;
}

export async function SetLastRead(url: string, title: string) {
    if (!(await hasConsent('f'))) return;
    await db.put('pref', { url, title }, 'app.history.last_read_page');
}

export async function SetupLastReadUI() {
    const lastRead = document.getElementById('home_LastRead');
    if (!lastRead) return;

    const a = lastRead.querySelector('a'),
        p = lastRead.querySelector('p');

    const val = await GetLastRead();
    if (!val || typeof val !== 'object' || !a || !p) {
        if (!a) lastRead.remove();
        else ((a.onclick = (e) => e.preventDefault()), false);
        if (!(await hasConsent('f')) && p) p.innerText = '您禁用了功能性 Cookies ，我们无法保存阅读进度数据。请考虑调整您的 Cookies 偏好。';
        return;
    }

    // a.onclick = e => (e.preventDefault(), router.push(val.url));
    a.href = val.url;
    p.innerText = val.title;
}

export async function SaveLastReadOnPageChange() {
    const loc = new URL(window.location.href);
    if (loc.pathname.startsWith('/dialog/') && loc.pathname.length > 8) {
        const raw = document.getElementById('page_title_short')?.innerText;
        const title = (() => {
            try {
                return raw ? new TextDecoder().decode(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))) : document.title;
            } catch {
                return document.title;
            }
        })();
        await SetLastRead(loc.href, title);
    }
}
