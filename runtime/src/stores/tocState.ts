import { defineStore } from 'pinia';

export interface TocItem {
    text: string;
    href: string;
    level: number;
    active: boolean;
}

export const useTocStore = defineStore('toc', {
    state: () => ({
        items: [] as TocItem[],
    }),
    actions: {
        setItems(items: TocItem[]) {
            this.items = items;
        },
        setActive(href: string) {
            for (const item of this.items) {
                item.active = item.href === href;
            }
        },
        clear() {
            this.items = [];
        },
    },
});
