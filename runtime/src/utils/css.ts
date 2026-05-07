export function attachCSS(cssText, owner = document) {
    if (typeof CSSStyleSheet !== 'undefined' &&
        typeof (owner && owner.adoptedStyleSheets && owner.adoptedStyleSheets.push) === 'function') {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        owner.adoptedStyleSheets.push(sheet);
        return sheet;
    }

    const style = document.createElement('style');
    style.textContent = cssText;
    (owner || document.head || document.documentElement).append(style);
    return style;
}