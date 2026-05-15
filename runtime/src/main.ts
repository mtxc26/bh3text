import { initDB } from '@/data'
import { setupApp } from '@/app'
import { setupCookieConsent } from '@/consent/cookie'
import { setup as setupElements } from '@/elements'
import { setupPrivacyLinks } from '@/consent/privacy'
import { setupStatistics } from '@/statistics'

export async function common_main() {
    // The following lines run immediately as soon as the script is loaded:
    await initDB()
    await setupApp()
    await setupCookieConsent()
    await setupElements()
    await setupPrivacyLinks()
    await setupStatistics()
}
