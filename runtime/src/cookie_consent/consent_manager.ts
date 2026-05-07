import { parse, serialize } from 'cookie'
import type { CookieConsent, ConsentCategory } from './types'

const COOKIE_NAME = 'cookie_consent'
const COOKIE_DOMAIN = '.bh3text.com'
const TWO_YEARS = 2 * 365 * 24 * 60 * 60

function resolveDomain(): string | undefined {
	const host = location.hostname
	if (('.' + host) === COOKIE_DOMAIN || host.endsWith(COOKIE_DOMAIN)) {
		return COOKIE_DOMAIN
	}
	return undefined
}

export function getConsent(): CookieConsent | null {
	try {
		const cookies = parse(document.cookie)
		const raw = cookies[COOKIE_NAME]
		if (!raw) return null
		return JSON.parse(raw) as CookieConsent
	} catch {
		return null
	}
}

export function setConsent(consent: CookieConsent): void {
    const current = getConsent()
    const normalized = { ...consent }
    if (!('ns' in normalized) && current?.ns) {
        normalized.ns = true
    }
    if (normalized.ns) {
        normalized.p = false
        normalized.t = false
    }
	document.cookie = serialize(COOKIE_NAME, JSON.stringify(normalized), {
		domain: resolveDomain(),
		maxAge: TWO_YEARS,
		path: '/',
	})
}

export function hasConsent(category: ConsentCategory): boolean {
	return getConsent()?.[category] === true
}

export function renewConsent(): void {
	const consent = getConsent()
	if (consent) setConsent(consent)
}
