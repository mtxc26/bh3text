export async function setupHashHighlight() {
    const hash = window.location.hash;
    if (!hash || hash.includes('/')) return;

    const el = document.getElementById(hash.slice(1));
    if (!el) return;

    const range = new Range();
    range.selectNodeContents(el);
    const hl = new Highlight(range);
    CSS.highlights.set('page-hash-highlight', hl);
}