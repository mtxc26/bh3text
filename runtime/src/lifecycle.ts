import type { RouteLocationGeneric } from "vue-router";
import { setupHashHighlight } from "./others/hash-highlight";
import { SaveLastReadOnPageChange } from "./preferences/last-read";

export async function onPageLoadFinish(page: RouteLocationGeneric) {
    await setupHashHighlight();
    await SaveLastReadOnPageChange();
}

