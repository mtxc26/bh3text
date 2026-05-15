import { hasConsent } from "@/consent/manager";
import { db } from "@/data";
import router from "@/router";

export async function GetLastRead() {
    if (!await hasConsent('f')) return null;
    return (await db.get('pref', 'app.history.last_read_page')) as { url: string; title: string; } ?? null;
}

export async function SetLastRead(url: string, title: string) {
    if (!await hasConsent('f')) return;
    await db.put('pref', { url, title }, 'app.history.last_read_page');
}

export async function SetupLastReadUI() {
    const lastRead = document.getElementById('home_LastRead');
    if (!lastRead) return;

    const a = lastRead.querySelector('a'), p = lastRead.querySelector('p');

    const val = await GetLastRead();
    if (!val || typeof val !== 'object' || !a || !p) {
        if (!a) lastRead.remove();
        else a.onclick = e => e.preventDefault(), false;
        return;
    }

    // a.onclick = e => (e.preventDefault(), router.push(val.url));
    a.href = val.url;
    p.innerText = val.title;
}

export async function SaveLastReadOnPageChange() {
    const loc = new URL(window.location.href);
    if (loc.pathname.startsWith('/dialog/') && loc.pathname.length > 8) await SetLastRead(loc.href, document.getElementById('page_title_short')?.innerText || document.title);
}
