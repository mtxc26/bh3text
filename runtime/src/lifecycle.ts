import type { RouteLocationGeneric } from 'vue-router';
import { setupHashHighlight } from './others/hash-highlight';
import { SaveLastReadOnPageChange } from './preferences/last-read';
import { RestoreScrollPos } from './preferences/scroll-pos';

export async function onPageLoadFinish(page: RouteLocationGeneric) {
    await setupHashHighlight();
    await SaveLastReadOnPageChange();
    await RestoreScrollPos();
}
