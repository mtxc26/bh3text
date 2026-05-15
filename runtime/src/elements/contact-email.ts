import {
    createCSS
} from 'add-css-constructed'
import type {
    ElementRegistryItem
} from './types'

const CSS = createCSS(`:host { display: inline-block }`);

let _worker: Worker | null = null
let _workerFailed = false

function _getWorker(): Worker | null {
    if (_worker) return _worker
    if (_workerFailed) return null
    try {
        _worker = new Worker('https://staticassets.bh3text.com/_r/worker/contact-emails_v1.js')
    } catch {
        _workerFailed = true
        return null
    }
    return _worker
}

function _requestEmail(type: string): Promise<string | null> {
    const worker = _getWorker()
    if (!worker) return Promise.resolve(null)

    return new Promise((resolve) => {
        const id = Math.random().toString(36).slice(2)
        const onMessage = (ev: MessageEvent) => {
            if (ev.data?.id !== id) return
            worker.removeEventListener('message', onMessage)
            resolve(ev.data?.data ?? null)
        }
        worker.addEventListener('message', onMessage)
        worker.postMessage({ id, type })
    })
}

class ContactEmailElement extends HTMLElement {
    static observedAttributes = ['type']

    private _shadow: ShadowRoot
    private _img: HTMLImageElement | null = null
    private _loadingEl: HTMLElement | null = null
    private _lock = false
    private _pending = false

    constructor() {
        super()
        this._shadow = this.attachShadow({
            mode: 'open'
        })
        CSS.attach(this._shadow)
    }

    connectedCallback() {
        this._render()
    }

    disconnectedCallback() {
        this._cleanup()
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
        if (name !== 'type' || _oldValue === newValue) return
        this._render()
    }

    private _cleanup() {
        if (this._img) {
            this._img.remove()
            this._img = null
        }
        if (this._loadingEl) {
            this._loadingEl.remove()
            this._loadingEl = null
        }
    }

    private _render() {
        if (this._lock) {
            this._pending = true
            return
        }

        this._lock = true
        this._pending = false

        this._cleanup()

        const type = this.getAttribute('type')
        if (!type) {
            this._lock = false
            return
        }

        const loadingEl = document.createElement('span')
        loadingEl.textContent = '正在加载，请稍候'
        this._shadow.appendChild(loadingEl)
        this._loadingEl = loadingEl

        _requestEmail(type)
            .then((uri) => {
                this._cleanup()

                const currentType = this.getAttribute('type')
                if (!currentType) return
                if (!uri) return

                const img = this._shadow.ownerDocument.createElement('img')
                img.src = uri
                this._shadow.appendChild(img)
                this._img = img
            })
            .catch(() => {
                this._cleanup()
            })
            .finally(() => {
                this._lock = false
                if (this._pending) {
                    this._render()
                }
            })
    }
}

export default {
    setup: () => customElements.define('contact-email', ContactEmailElement),
    element: ContactEmailElement,
    tag_name: 'contact-email',
} as const satisfies ElementRegistryItem<ContactEmailElement>
