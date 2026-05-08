import { setupApp } from '@/app'
import { setupCookieConsent } from '@/consent/cookie'
import { setup as setupElements } from '@/elements'
import { setupPrivacyLinks } from '@/consent/privacy'
import { setupStatistics } from '@/statistics'

export async function common_main() {
    await setupApp()
	await setupPrivacyLinks()
	await setupCookieConsent()
	await setupElements()
	await setupStatistics()
}
