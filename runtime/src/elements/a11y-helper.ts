import { attachCSS } from '@/utils/css';
import type { ElementRegistryItem } from './types';

const CSS = `
:host[type="mixedDisplay"], :host[type="hideDisplay"] {
    display: inline-block;
    width: 0;
    height: 0;
    overflow: hidden;
    box-sizing: border-box;
}
:host[type="mixedDisplay"], :host[type="onlyDisplay"] {
    display: inline-block;
}
:host[type="mixedDisplay"]::before, :host[type="onlyDisplay"]::before {
    content: attr(content);
    display: inline-block;
    width: auto;
}
`;

class a11yHelperElement extends HTMLElement {
    _shadow;
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        attachCSS(CSS, this._shadow);
        const slot = document.createElement('slot');
        this._shadow.append(slot);
    }
}

export default ({
    setup: () => customElements.define('a11y-helper', a11yHelperElement),
    element: a11yHelperElement,
    tag_name: 'a11y_helper'
}) as const satisfies ElementRegistryItem;

