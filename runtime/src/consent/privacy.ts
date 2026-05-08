import { vm } from '@/app'
import svg from '@/resources/privacyoptions.svg?no-inline'

function buildIcon(): HTMLElement {
    const el = document.createElement('img')
    el.src = svg;
    el.alt = 'California Consumer Privacy Act (CCPA) Opt-Out Icon';
    el.height = 14;
	return el
}

function createPrivacyLink(text: string) {
	const a = document.createElement('a')
	a.href = 'javascript:void 0'
	a.addEventListener('click', (e) => {
		e.preventDefault()
		;(vm as any).showPrivacyCenter()
	})
	a.textContent = text
	return a
}

export async function setupPrivacyLinks() {
	const el = document.getElementById('privacy_consent') ?? document.body.appendChild(document.createElement('div'))
	if (!el || el instanceof HTMLTemplateElement) return
	if (!el.id) el.id = 'privacy_consent'

	const privacy = createPrivacyLink('Your Privacy Choices')
	privacy.style.display = 'inline-flex'
	privacy.style.alignItems = 'center'
	privacy.style.gap = '6px'
	privacy.insertBefore(buildIcon(), privacy.firstChild)

	el.append(privacy)
}
