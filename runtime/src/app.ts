import { createApp, type App, type ComponentPublicInstance } from 'vue'
import { createPinia } from 'pinia'
// import { injectCSS, getRawCSS } from 'virtual:css-injected-by-js'
// import { createCSS } from 'add-css-constructed'
import 'vue-dialog-view/style'
import router from './router'
import Runtime from './Runtime.vue'
import MyApp from './App.vue'
import { init } from './init'
import type { CookieConsent } from '@/consent/types'
import '@/styles/style.css'
import { onPageLoadFinish } from './lifecycle'

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
// export let app_css: ReturnType<typeof createCSS>;

export async function setupApp() {
    container = document.createElement('div')
    document.body.append(container)
    //shadow = container.attachShadow({ mode: 'open' })
    // //injectCSS({ target: shadow })
    // app_css = createCSS(getRawCSS())
    // app_css.attach()
    const app_css = document.createElement('link')
    app_css.rel = "stylesheet"
    //console.log(import.meta.env)
    // @ts-ignore
    app_css.href = new URL('./style.css', new URL(__OUTFILE_DEPLOY_PATH__, location.href)).href + '?ref=git%3A' + __BUILD_ID__
    document.head.append(app_css)

    const real_container = document.createElement('div')
    //shadow.append(real_container)
    container.append(real_container)

    runtime_app = createApp(Runtime)
    runtime_vm = runtime_app.mount(real_container) as any as RuntimeVM

    const appc = document.createElement('div')
    container.append(appc)
    app = createApp(MyApp)
    app.use(createPinia())
    app.use(router)
    await init();
    (function () {
        let count = 0
        router.afterEach(async (to) => {
            const initCount = ++count
            // ensure is loaded
            await new Promise<void>(resolve => {
                if (window.document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', () => {
                        resolve();
                    }, { once: true });
                }
            });
            if (count !== initCount) return; // avoid duplicate:wq
            
            await onPageLoadFinish(to);
        })
    })();
    vm = app.mount(appc) as any as MyVM
}

