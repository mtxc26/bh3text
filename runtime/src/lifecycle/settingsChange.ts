import { db } from "@/data";

export async function onSettingsChange() {
    const html = document.documentElement;
    const setClass = (c: string, v: boolean) => { 
        if (v) { if (!html.classList.contains(c)) html.classList.add(c); }
        else { if (html.classList.contains(c)) html.classList.remove(c); }
    }

    const copyPref = (await db.get('config', 'user.pref.ui.copy_pref')) ?? 1;
    setClass('dialog-settings-no-copy-descriptive', copyPref === 2 ? true : false);

    
}
