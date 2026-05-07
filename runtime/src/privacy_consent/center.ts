import { LitElement, html, css } from 'lit'
import { TAG } from '@/utils/tag_name'
import type { CookieConsent } from '@/cookie_consent/types'
import { getConsent } from '@/cookie_consent/consent_manager'
import { showConsentDialog } from '@/cookie_consent'
import { DoNotSellDialog } from './dns-dialog'

let _dnsDialog: DoNotSellDialog | null = null

function getDnsDialog(): DoNotSellDialog {
	if (!_dnsDialog) {
		_dnsDialog = document.createElement(DoNotSellDialog.tag_name) as DoNotSellDialog
		document.body.appendChild(_dnsDialog)
	}
	return _dnsDialog
}

export class PrivacyConsentCenter extends LitElement {
	static tag_name = TAG('privacy-consent-center')
	static override properties = {
		_showSuccess: { state: true },
	}

	private _showSuccess = false
	private _resolve: ((v: CookieConsent) => void) | null = null

	static override styles = css([`
		dialog {
			border: none;
			border-radius: 12px;
			padding: 28px 32px;
			width: 420px;
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
			margin: 0 0 20px;
		}
		.section {
			margin-bottom: 16px;
			display: flex;
			flex-direction: column;
		}
		.section:last-child {
			margin-bottom: 0;
		}
		.success-msg {
			background: #e8f5e9;
			border: 1px solid #a5d6a7;
			border-radius: 8px;
			padding: 14px 16px;
			font-size: 13px;
			color: #2e7d32;
			line-height: 1.5;
		}
		.link-preferences {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 16px;
			border: 1px solid #ddd;
			border-radius: 8px;
			background: #fafafa;
			color: #333;
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			transition: background 0.15s;
		}
		.link-preferences:hover {
			background: #f0f0f0;
		}
		.arrow {
			color: #999;
			font-size: 16px;
		}
		.close-row {
			display: flex;
			justify-content: flex-end;
			margin-top: 20px;
		}
		.btn-close {
			padding: 8px 20px;
			border: none;
			border-radius: 8px;
			background: #f0f0f0;
			color: #333;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			transition: opacity 0.15s;
		}
		.btn-close:hover {
			opacity: 0.85;
		}
	`])

	show(): Promise<CookieConsent> {
		this._showSuccess = false
		return new Promise((resolve) => {
			this._resolve = resolve
			this.requestUpdate()
			this.updateComplete.then(() => {
				const dialog = this.renderRoot.querySelector('dialog')!
				dialog.showModal()
			})
		})
	}

	private async _doNotSell() {
		const confirmed = await getDnsDialog().show()
		if (confirmed) {
			this._showSuccess = true
		}
	}

	private _openPreferences() {
		const dialog = this.renderRoot.querySelector('dialog')
		dialog?.close()
		showConsentDialog().then((consent) => {
			this._resolve?.(consent)
			this._resolve = null
		})
	}

	private _close() {
		const consent = getConsent() ?? { n: true, f: false, p: false, t: false }
		const dialog = this.renderRoot.querySelector('dialog')
		dialog?.close()
		this._resolve?.(consent)
		this._resolve = null
	}

	override render() {
		return html`
			<dialog>
				<h2 class="title">Your Privacy Choices</h2>
				<div class="section">
					<button type="button" class="link-preferences" @click=${this._doNotSell}>
						Do Not Sell or Share My Personal Information
					</button>
				</div>
				<div class="section">
					<button type="button" class="link-preferences" @click=${this._openPreferences}>
						<span>Cookies Preferences</span>
						<span class="arrow">›</span>
					</button>
				</div>
				<div class="section">
					<a class="link-preferences" href="/about/privacy.html" style="text-decoration:none;color:inherit">
						<span>Privacy Policy</span>
						<span class="arrow">›</span>
					</a>
				</div>
				<div class="close-row">
					<button type="button" class="btn-close" @click=${this._close}>关闭</button>
				</div>
			</dialog>
		`
	}
}

customElements.define(PrivacyConsentCenter.tag_name, PrivacyConsentCenter)
