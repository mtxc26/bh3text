import { LitElement, html, css } from 'lit'
import { TAG } from '@/utils/tag_name'
import type { CookieConsent } from '@/cookie_consent/types'
import { setConsent, getConsent } from '@/cookie_consent/consent_manager'

export class DoNotSellDialog extends LitElement {
	static tag_name = TAG('do-not-sell-dialog')
	static override properties = {
		_ns: { state: true },
	}

	private _ns = true
	private _resolve: ((v: boolean) => void) | null = null

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
			margin: 0 0 8px;
		}
		.desc {
			font-size: 14px;
			color: #666;
			margin: 0 0 20px;
			line-height: 1.5;
		}
		.option {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			padding: 14px 16px;
			border: 1px solid #ddd;
			border-radius: 8px;
			background: #fafafa;
			margin-bottom: 20px;
		}
		.option input[type="checkbox"] {
			margin-top: 2px;
			flex-shrink: 0;
			width: 18px;
			height: 18px;
			cursor: pointer;
		}
		.option-body {
			flex: 1;
		}
		.option-label {
			font-size: 14px;
			font-weight: 600;
		}
		.option-desc {
			font-size: 12px;
			color: #888;
			margin-top: 4px;
			line-height: 1.4;
		}
		.actions {
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

	show(): Promise<boolean> {
		const current = getConsent()
		this._ns = !!(current?.ns)
		return new Promise((resolve) => {
			this._resolve = resolve
			this.requestUpdate()
			this.updateComplete.then(() => {
				this.renderRoot.querySelector<HTMLDialogElement>('dialog')!.showModal()
			})
		})
	}

	private _confirm() {
		const current = getConsent()
		const consent: CookieConsent = {
			n: true,
			f: current?.f ?? true,
			p: this._ns ? false : (current?.p ?? false),
			t: this._ns ? false : (current?.t ?? false),
		}
		consent.ns = this._ns
		setConsent(consent)
		this.renderRoot.querySelector('dialog')?.close()
		this._resolve?.(this._ns)
		this._resolve = null
	}

	private _cancel() {
		this.renderRoot.querySelector('dialog')?.close()
		this._resolve?.(false)
		this._resolve = null
	}

	override render() {
		return html`
			<dialog>
				<label class="option">
					<input
						type="checkbox"
						.checked=${this._ns}
						@change=${(e: Event) => { this._ns = (e.target as HTMLInputElement).checked }}
					/>
					Do Not Sell or Share My Personal Information
				</label>
				<div class="actions">
					<button class="btn btn-primary" @click=${this._confirm}>Apply Changes</button>
					<button class="btn btn-secondary" @click=${this._cancel}>Discard Changes</button>
				</div>
			</dialog>
		`
	}
}

customElements.define(DoNotSellDialog.tag_name, DoNotSellDialog)
