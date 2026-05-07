import { getConsent, setConsent, renewConsent } from './consent_manager'
import { CookieConsentDialog } from './dialog'
import { getUserCountry } from '@/utils/usercountry'
import type { CookieConsent } from './types'

export type { CookieConsent } from './types'
export { getConsent, setConsent, hasConsent, renewConsent } from './consent_manager'

let _dialog: CookieConsentDialog | null = null

function getDialog(): CookieConsentDialog {
	if (!_dialog) {
		_dialog = document.createElement(CookieConsentDialog.tag_name) as CookieConsentDialog
		document.body.appendChild(_dialog)
	}
	return _dialog
}

export async function setupCookieConsent(): Promise<CookieConsent> {
	renewConsent()
	const existing = getConsent()
	if (existing) return existing

	const country = await getUserCountry()
	if (country === 'CN') {
		return { n: true, f: true, p: true, t: true }
	}

	const dialog = getDialog()
	return dialog.show()
}

export function showConsentDialog(): Promise<CookieConsent> {
	const dialog = getDialog()
	return dialog.show(getConsent() ?? undefined)
}
