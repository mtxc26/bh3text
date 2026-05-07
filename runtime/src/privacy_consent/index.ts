import { PrivacyConsentCenter } from './center'
import svg from '@/resources/privacyoptions.svg'

const SVG_WIDTH = '30'
const SVG_HEIGHT = '14'

function buildIcon(): SVGElement {
	const parser = new DOMParser()
	const doc = parser.parseFromString(svg, 'image/svg+xml')
	const el = doc.documentElement as unknown as SVGElement
	el.setAttribute('width', SVG_WIDTH)
	el.setAttribute('height', SVG_HEIGHT)
	el.style.flexShrink = '0'
	return el
}

let _center: PrivacyConsentCenter | null = null

function getCenter(): PrivacyConsentCenter {
	if (!_center) {
		_center = document.createElement(PrivacyConsentCenter.tag_name) as PrivacyConsentCenter
		document.body.appendChild(_center)
	}
	return _center
}

function createPrivacyLink(text: string) {
	const a = document.createElement('a')
	a.href = 'javascript:void 0'
	a.addEventListener('click', (e) => {
		e.preventDefault()
		getCenter().show()
	})
	a.textContent = text
	return a
}

export async function setupPrivacyLinks() {
	const el = document.getElementById('privacy_consent') ?? document.body.appendChild(document.createElement('div'))
	if (!el || el instanceof HTMLTemplateElement) return
	if (!el.id) el.id = 'privacy_consent';

	const privacy = createPrivacyLink('Your Privacy Choices')
	privacy.style.display = 'inline-flex'
	privacy.style.alignItems = 'center'
	privacy.style.gap = '6px'
	privacy.insertBefore(buildIcon(), privacy.firstChild)

	el.append(privacy)
}
