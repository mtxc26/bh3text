import { LitElement, html, css } from 'lit'
import { TAG } from '@/utils/tag_name'
import { CONSENT_CATEGORIES } from './types'
import type { CookieConsent, ConsentCategory } from './types'
import { setConsent, getConsent } from './consent_manager'

export class CookieConsentDialog extends LitElement {
	static tag_name = TAG('cookie-consent-dialog')
	static override properties = {
		_consent: { state: true },
	}

	private _resolve: ((v: CookieConsent) => void) | null = null
	private _consent: CookieConsent = { n: true, f: false, p: false, t: false }

	static override styles = css([`
		dialog {
			border: none;
			border-radius: 12px;
			padding: 28px 32px;
			width: 400px;
			max-width: calc(100% - 2em);
			max-height: calc(100% - 2em);
			box-sizing: border-box;
			color: #333;
			overflow: auto;
		}
		dialog::backdrop {
			background: rgba(0, 0, 0, 0.5);
		}
		.title {
			font-size: 18px;
			font-weight: 700;
			margin: 0 0 8px;
		}
		.desc {
			font-size: 14px;
			color: #666;
			margin: 0 0 20px;
			line-height: 1.5;
		}
		.categories {
			list-style: none;
			margin: 0;
			padding: 0;
		}
		.category {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 0;
			border-bottom: 1px solid #eee;
		}
		.category:last-child {
			border-bottom: none;
		}
		.category-body {
			flex: 1;
			min-width: 0;
		}
		.category-label {
			font-size: 14px;
			font-weight: 600;
		}
		.category-desc {
			font-size: 12px;
			color: #888;
			margin-top: 2px;
		}
		.toggle {
			flex-shrink: 0;
			position: relative;
			width: 44px;
			height: 24px;
			display: block;
		}
		.toggle input {
			position: absolute;
			opacity: 0;
			width: 100%;
			height: 100%;
			margin: 0;
			cursor: pointer;
		}
		.toggle input:disabled {
			cursor: not-allowed;
		}
		.toggle-track {
			display: block;
			width: 100%;
			height: 100%;
			border-radius: 12px;
			background: #ccc;
			transition: background 0.2s;
		}
		.toggle input:checked + .toggle-track {
			background: #4a90d9;
		}
		.toggle input:disabled + .toggle-track {
			opacity: 0.6;
		}
		.toggle-track::after {
			content: '';
			position: absolute;
			top: 2px;
			left: 2px;
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: #fff;
			transition: transform 0.2s;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		}
		.toggle input:checked + .toggle-track::after {
			transform: translateX(20px);
		}
		.actions {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-top: 20px;
		}
		.actions-row {
			display: flex;
			gap: 8px;
		}
		.btn {
			flex: 1;
			padding: 10px 16px;
			border: none;
			border-radius: 8px;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: opacity 0.15s;
		}
		.btn:hover {
			opacity: 0.85;
		}
		.btn-primary {
			background: #4a90d9;
			color: #fff;
		}
		.btn-secondary {
			background: #f0f0f0;
			color: #333;
		}
	`])

	async show(existing?: CookieConsent): Promise<CookieConsent> {
		this._consent = existing ? { ...existing } : { n: true, f: false, p: false, t: false }
		await this.updateComplete
		return new Promise((resolve) => {
			this._resolve = resolve
			this.renderRoot.querySelector<HTMLDialogElement>('dialog')!.showModal()
		})
	}

	private _toggle(key: ConsentCategory, checked: boolean) {
		this._consent = { ...this._consent, [key]: checked }
		setConsent(this._consent)
		this._consent = getConsent() ?? this._consent
	}

	private _rejectAll() {
		setConsent({ n: true, f: false, p: false, t: false })
		this._consent = getConsent() ?? this._consent
		this.renderRoot.querySelector<HTMLDialogElement>('dialog')?.close()
	}

	private _save() {
		this.renderRoot.querySelector<HTMLDialogElement>('dialog')?.close()
	}

	private _onClose() {
		if (!this._resolve) return
		this._resolve({ ...this._consent })
		this._resolve = null
	}

	override render() {
		return html`
			<dialog @close=${this._onClose}>
				<h2 class="title">Cookie 偏好设置</h2>
				<p class="desc">我们使用 Cookie 来改善您的浏览体验。您可以在此处选择允许的 Cookie 类别。</p>
				<ul class="categories">
					${CONSENT_CATEGORIES.map(
						(cat) => html`
							<li class="category">
								<div class="category-body">
									<div class="category-label">${cat.label}</div>
									<div class="category-desc">${cat.description}</div>
								</div>
								<label class="toggle">
									<input
										type="checkbox"
										.checked=${this._consent[cat.key]}
										?disabled=${cat.required || (!!this._consent.ns && (cat.key === 'p' || cat.key === 't'))}
										@change=${(e: Event) => this._toggle(cat.key, (e.target as HTMLInputElement).checked)}
									/>
									<span class="toggle-track"></span>
								</label>
							</li>
						`,
					)}
				</ul>
				<div class="actions">
					<div class="actions-row">
						<button class="btn btn-primary" @click=${this._save}>保存偏好</button>
						<button class="btn btn-secondary" @click=${this._rejectAll}>仅接受必要 Cookies</button>
					</div>
				</div>
			</dialog>
		`
	}
}

customElements.define(CookieConsentDialog.tag_name, CookieConsentDialog)
