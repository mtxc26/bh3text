import { runtime_vm as vm } from '@/app'
import { readConsent, writeConsent, renewConsent, _setInit } from './manager'
import { getUserCountry } from '@/utils/usercountry'
import type { CookieConsent } from './types'

export type { CookieConsent } from './types'
export { getConsent, setConsent, hasConsent } from './manager'

export function setupCookieConsent(): Promise<CookieConsent> {
	const init = _setupCookieConsent()
	_setInit(init.then(() => {}))
	return init
}

async function _setupCookieConsent(): Promise<CookieConsent> {
	renewConsent()
	const existing = readConsent()

	if (existing) {
		if (!existing._a) return existing
		const country = await getUserCountry()
		if (country === 'CN') {
			writeConsent({ n: true, f: true, p: true, t: true, _a: true })
			return readConsent()!
		}
		writeConsent({ n: true, f: false, p: false, t: false })
		return (vm as any).showConsentDialog()
	}

	const country = await getUserCountry()
	if (country === 'CN') {
		const c: CookieConsent = { n: true, f: true, p: true, t: true, _a: true }
		writeConsent(c)
		return c
	}

	return (vm as any).showConsentDialog()
}

export function showConsentDialog(): Promise<CookieConsent> {
	return (vm as any).showConsentDialog(readConsent() ?? undefined)
}
