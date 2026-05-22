export async function setupHashHighlight() {
    try {
        const hash = window.location.hash;
        if (!hash || hash.includes('/') || hash.includes('#:~:text=')) return;

        const el = document.getElementById(hash.slice(1));
        if (!el) return;

        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        const range = new Range();
        range.selectNodeContents(el);
        const hl = new Highlight(range);
        CSS.highlights.set('page-hash-highlight', hl);
    } catch (e) {
        console.warn('[highlight]', 'Failed to highlight the element:', e);
    }
}
