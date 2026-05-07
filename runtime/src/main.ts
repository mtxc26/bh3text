import { setupCookieConsent } from '@/cookie_consent'
import { setup as setupElements } from '@/elements'
import { setupPrivacyLinks } from '@/privacy_consent'
import { setupStatistics } from '@/statistics'

export async function common_main() {
	await setupPrivacyLinks()
	await setupCookieConsent()
	await setupElements()
	await setupStatistics()
}
