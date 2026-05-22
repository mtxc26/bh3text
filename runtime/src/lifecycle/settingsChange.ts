import { getSettings } from '@/settings';

export async function onSettingsChange() {
    const html = document.documentElement;
    const setClass = (c: string, v: boolean) => {
        if (v) {
            if (!html.classList.contains(c)) html.classList.add(c);
        } else {
            if (html.classList.contains(c)) html.classList.remove(c);
        }
    };

    const copyPref = await getSettings('user.pref.ui.copy_pref');
    setClass('dialog-settings-no-copy-descriptive', copyPref === 2 ? true : false);

    const hideSynopsis = !(await getSettings('user.pref.ui.dialogue.show_synopsis'));
    setClass('dialog-settings-no-synopsis', hideSynopsis);
}
