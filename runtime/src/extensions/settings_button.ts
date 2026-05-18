import { useAppStateStore } from '@/stores/appState';

function createLink(text: string) {
    const a = document.createElement('a');
    a.href = '#';
    a.addEventListener('click', (e) => {
        e.preventDefault();
        useAppStateStore().settingDialogOpen = true;
    });
    a.textContent = text;
    return a;
}

export async function setupSettingsButton() {
    const el = document.getElementById('settings_link:container');
    if (!el || el instanceof HTMLTemplateElement) return;

    el.append(createLink('设置'));
}
