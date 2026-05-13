import { setupApp } from '@/app'
import { setupCookieConsent } from '@/consent/cookie'
import { setup as setupElements } from '@/elements'
import { setupHashHighlight } from '@/others/hash-highlight'
import { setupPrivacyLinks } from '@/consent/privacy'
import { setupStatistics } from '@/statistics'

export async function common_main() {
    await setupApp()
    await setupCookieConsent()
    await setupElements()
    await setupHashHighlight()
    await setupPrivacyLinks()
    await setupStatistics()
}
