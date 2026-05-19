import { LitElement, html, css } from 'lit';
import { db } from '@/data';
import type { ElementRegistryItem } from './types';

interface CGData {
    display_name?: string;
    link?: {
        isExternal?: boolean;
        externalName?: string;
        href?: string;
    };
    inlinePlayer?: {
        enabled?: boolean;
        providerName?: string;
        src?: string;
    };
}

class CgViewerElement extends LitElement {
    static properties = {
        _allowRender: { state: true },
        _showIframe: { state: true },
        cg: { type: String, reflect: true },
        data: { type: String, reflect: true },
    };

    static styles = css`
        :host {
            display: block;
            position: relative;
        }

        .player-container {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .player-container a {
            text-decoration: none;
        }

        .display-name {
            color: #fff;
            font-size: 14px;
            margin-bottom: 16px;
            text-align: center;
        }

        .play-btn {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .play-btn:hover {
            background: rgba(255, 255, 255, 0.35);
        }

        .play-btn::after {
            content: '';
            display: block;
            width: 0;
            height: 0;
            border-left: 20px solid #fff;
            border-top: 12px solid transparent;
            border-bottom: 12px solid transparent;
            margin-left: 4px;
        }

        .player-container iframe {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
        }

        .newtab-btn {
            position: absolute;
            left: 5px;
            top: 5px;
            border-radius: 10px;
            border: 1px solid gray;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            font-size: large;
            z-index: 999;
        }
    `;

    declare cg: string;
    declare data: string;

    declare _showIframe: boolean;

    declare _allowRender: boolean | null;

    get _parsedData(): CGData {
        try {
            return JSON.parse(this.data || '{}');
        } catch {
            return {};
        }
    }

    firstUpdated() {
        this._checkPermission();
    }

    async _checkPermission() {
        try {
            this._allowRender = (await db.get('config', 'user.pref.ui.cgview.allow_render')) === false ? false : true;
        } catch {
            this._allowRender = false;
        }
    }

    _handlePlay() {
        this._showIframe = true;
    }

    _openBlank() { 
        if (this._parsedData.link) window.open(this._parsedData.link.href, '_blank');
    }

    render() {
        if (this._allowRender === null) {
            return html`<slot></slot>`;
        }

        if (!this._allowRender) {
            return html`<slot></slot>`;
        }

        const { link, inlinePlayer, display_name } = this._parsedData;

        if (inlinePlayer?.enabled && inlinePlayer?.src) {
            return html`
                <div class="player-container">
                    ${this._showIframe
                        ? html`<button type=button class=newtab-btn aria-label=在新标签页中打开 @click=${this._openBlank}>新标签页打开</button><iframe sandbox="allow-scripts allow-same-origin allow-forms" src=${inlinePlayer.src} allow="fullscreen *" allowfullscreen title=${display_name || '播放'}></iframe>`
                        : html`
                              <a class="display-name" rel="noopener" target="_blank" .href=${link?.href || inlinePlayer.src}>${display_name || ''}</a>
                              <button type="button" class="play-btn" aria-label="播放" @click=${this._handlePlay}></button>
                          `}
                </div>
            `;
        }

        return html`<slot></slot>`;
    }
}

export default {
    setup: () => customElements.define('cg-viewer', CgViewerElement),
    element: CgViewerElement,
    tag_name: 'cg-viewer',
} satisfies ElementRegistryItem;
