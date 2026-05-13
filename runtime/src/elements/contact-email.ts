import GetContactEmail from '@/local-private-dist/contact-emails.js'
import { createCSS } from 'add-css-constructed'
import type { ElementRegistryItem } from './types'

const CSS = createCSS(`:host { display: inline-block }`);

class ContactEmailElement extends HTMLElement {
	static observedAttributes = ['type']

	private _shadow: ShadowRoot
	private _img: HTMLImageElement | null = null

	constructor() {
		super()
		this._shadow = this.attachShadow({ mode: 'open' })
		CSS.attach(this._shadow);
	}

	connectedCallback() {
		this._render()
	}

	disconnectedCallback() {
		this._cleanup()
	}

	attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
		if (name !== 'type' || _oldValue === newValue) return
		this._render()
	}

	private _cleanup() {
		if (this._img) {
			this._img.remove()
			this._img = null
		}
	}

	private _render() {
		this._cleanup()
		const type = this.getAttribute('type')
		if (!type) return

		const uri = GetContactEmail(type)
		if (!uri) return

		const img = this._shadow.ownerDocument.createElement('img')
		img.src = uri
		this._shadow.appendChild(img)
		this._img = img
	}
}

export default {
	setup: () => customElements.define('contact-email', ContactEmailElement),
	element: ContactEmailElement,
	tag_name: 'contact-email',
} as const satisfies ElementRegistryItem<ContactEmailElement>
