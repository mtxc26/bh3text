import { parse, serialize } from 'cookie'
import type { CookieConsent, ConsentCategory } from './types'

const COOKIE_NAME = 'cookie_consent'
const COOKIE_DOMAIN = '.bh3text.com'
const TWO_YEARS = 2 * 365 * 24 * 60 * 60

// --- init gate ---
let _initPromise: Promise<void> | null = null
let _initialized = false

export function _setInit(p: Promise<void>) {
	_initPromise = p.then(() => { _initialized = true })
}

function _waitInit(): Promise<void> {
	if (_initialized) return Promise.resolve()
	if (_initPromise) return _initPromise
	return Promise.resolve()
}

// --- internal sync operations ---
function resolveDomain(): string | undefined {
	const host = location.hostname
	if (('.' + host) === COOKIE_DOMAIN || host.endsWith(COOKIE_DOMAIN)) {
		return COOKIE_DOMAIN
	}
	return undefined
}

export function readConsent(): CookieConsent | null {
	try {
		const cookies = parse(document.cookie)
		const raw = cookies[COOKIE_NAME]
		if (!raw) return null
		return JSON.parse(raw) as CookieConsent
	} catch {
		return null
	}
}

export function writeConsent(consent: CookieConsent): void {
	const current = readConsent()
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

export function renewConsent(): void {
	const consent = readConsent()
	if (consent) writeConsent(consent)
}

// --- public async API ---
export async function getConsent(): Promise<CookieConsent | null> {
	await _waitInit()
	return readConsent()
}

export async function setConsent(consent: CookieConsent): Promise<void> {
	await _waitInit()
	writeConsent(consent)
}

export async function hasConsent(category: ConsentCategory): Promise<boolean> {
	const consent = await getConsent()
	return consent?.[category] === true
}
