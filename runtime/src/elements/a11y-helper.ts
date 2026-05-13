import { createCSS } from 'add-css-constructed';
import type { ElementRegistryItem } from './types';

const CSS = createCSS(`
div {
    display: inline;
}
#onlyDisplay__content {
    display: none;
}
:host {
    display: inline-block;
}
:host([type="hideDisplay"]) #outer_content,
:host([type="onlyDisplay"]) #outer_content {
    /* Browsers require a element has nonzero size to be selected */
    display: inline-block;
    width: 1px;
    height: 1px;
    color: transparent;
    overflow: hidden;
    box-sizing: border-box;
    user-select: all;
}
:host([type="onlyDisplay"]) #onlyDisplay__content {
    display: inline;
}
:host([type="onlyDisplay"]) #onlyDisplay__content::before {
    display: inline-block;
    content: attr(data-content);
}
`);

class a11yHelperElement extends HTMLElement {
    _shadow: ShadowRoot;

    static observedAttributes = ['type', 'content'];

    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        CSS.attach(this._shadow);

        const outer = document.createElement('div');
        outer.id = 'outer_content';
        outer.append(document.createElement('slot'));

        const onlyDisplay = document.createElement('div');
        onlyDisplay.id = 'onlyDisplay__content';

        this._shadow.append(outer, onlyDisplay);
    }

    connectedCallback() {
        this._updateOnlyDisplay();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, _newValue: string | null) {
        if (name === 'content') {
            this._updateOnlyDisplay();
        }
    }

    _updateOnlyDisplay() {
        const div = this._shadow.getElementById('onlyDisplay__content');
        if (div) {
            div.setAttribute('data-content', this.getAttribute('content') || '');
        }
    }
}

export default ({
    setup: () => customElements.define('a11y-helper', a11yHelperElement),
    element: a11yHelperElement,
    tag_name: 'a11y-helper'
}) as const satisfies ElementRegistryItem;

