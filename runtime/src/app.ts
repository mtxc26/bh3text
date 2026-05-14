import { createApp, type App, type ComponentPublicInstance } from 'vue'
import Runtime from './Runtime.vue'
import MyApp from './App.vue'
import type { CookieConsent } from '@/consent/types'
import { injectCSS, getRawCSS } from 'virtual:css-injected-by-js'
import { addCSS } from 'add-css-constructed'
import 'vue-dialog-view/style'

interface RuntimeVM extends ComponentPublicInstance {
  showConsentDialog(existing?: CookieConsent): Promise<CookieConsent>
  showPrivacyCenter(): Promise<CookieConsent>
}
interface MyVM extends ComponentPublicInstance {

}

let container: HTMLDivElement
//let shadow: ShadowRoot
export let runtime_app: App
export let runtime_vm: RuntimeVM
export let app: App
export let vm: MyVM

export async function setupApp() {
    container = document.createElement('div')
    document.body.append(container)
    //shadow = container.attachShadow({ mode: 'open' })
    //injectCSS({ target: shadow })
    addCSS(getRawCSS())
    
    const real_container = document.createElement('div')
    //shadow.append(real_container)
    container.append(real_container)
    
    runtime_app = createApp(Runtime)
    runtime_vm = runtime_app.mount(real_container) as any as RuntimeVM
    
    const appc = document.createElement('div')
    container.append(appc)
    app = createApp(MyApp)
    vm = app.mount(appc) as any as MyVM
}

