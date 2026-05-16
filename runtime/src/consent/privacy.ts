import { runtime_vm as vm } from '@/app';
import svg from '@/resources/privacyoptions.svg?raw';

function buildIcon(): Element {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg')!;
    svgEl.setAttribute('aria-label', 'California Consumer Privacy Act (CCPA) Opt-Out Icon');
    svgEl.setAttribute('role', 'img');
    svgEl.removeAttribute('id');
    svgEl.setAttribute('style', 'margin: auto; height: 1.2em;');
    return svgEl;
}

function createPrivacyLink(text: string) {
    const a = document.createElement('a');
    a.href = 'javascript:void 0';
    a.addEventListener('click', (e) => {
        e.preventDefault();
        (vm as any).showPrivacyCenter();
    });
    a.textContent = text;
    return a;
}

export async function setupPrivacyLinks() {
    const el =
        document.getElementById('privacy_consent') ??
        document.body.appendChild(document.createElement('div'));
    if (!el || el instanceof HTMLTemplateElement) return;
    if (!el.id) el.id = 'privacy_consent';

    const privacy = createPrivacyLink('Your Privacy Choices');
    privacy.style.display = 'inline-flex';
    privacy.style.alignItems = 'center';
    privacy.style.gap = '6px';
    privacy.style.whiteSpace = 'nowrap';
    privacy.insertBefore(buildIcon(), privacy.firstChild);

    el.append(privacy);
}
