import { createApp, type App, type ComponentPublicInstance } from 'vue'
import Runtime from './Runtime.vue'
import type { CookieConsent } from '@/consent/types'
import { injectCSS } from 'virtual:css-injected-by-js'
import 'vue-dialog-view/style'

interface RuntimeVM extends ComponentPublicInstance {
  showConsentDialog(existing?: CookieConsent): Promise<CookieConsent>
  showPrivacyCenter(): Promise<CookieConsent>
}

let container: HTMLDivElement
let shadow: ShadowRoot
export let app: App
export let vm: RuntimeVM

export async function setupApp() {
    container = document.createElement('div')
    document.body.append(container)
    shadow = container.attachShadow({ mode: 'open' })
    injectCSS({ target: shadow })
    
    const real_container = document.createElement('div')
    shadow.append(real_container)
    
    app = createApp(Runtime)
    vm = app.mount(real_container) as any as RuntimeVM
}

