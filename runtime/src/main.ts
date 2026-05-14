import { initDB } from '@/data'
import { setupApp } from '@/app'
import { setupCookieConsent } from '@/consent/cookie'
import { setup as setupElements } from '@/elements'
import { setupPrivacyLinks } from '@/consent/privacy'
import { setupStatistics } from '@/statistics'
import { setupHashHighlight } from '@/others/hash-highlight'

export async function common_main() {
    // The following lines run immediately as soon as the script is loaded:
    await initDB()
    await setupApp()
    await setupCookieConsent()
    await setupElements()
    await setupPrivacyLinks()
    await setupStatistics()
    
    // ---
    await new Promise<void>(resolve => {
        if (window.document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', () => {
                resolve();
            }, { once: true });
        }
    });
    // The following lines run after the load event is triggered:
    await setupHashHighlight()
    
}
