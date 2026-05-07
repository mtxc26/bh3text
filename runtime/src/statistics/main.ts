import { hasConsent } from '@/cookie_consent'

const PROD_HOST = '.bh3text.com'

function isProd(): boolean {
	const host = location.hostname
	return ('.' + host) === PROD_HOST || host.endsWith(PROD_HOST)
}

export async function setupStatistics() {
	if (!isProd() || !hasConsent('p')) return

	const script = document.createElement('script')
	script.defer = true
	script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
	script.setAttribute('data-cf-beacon', '{"token": "396dde6ebb1a462fa555614d7e175e7d"}')
	document.head.appendChild(script)
}
