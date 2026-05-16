<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useTocStore } from '@/stores/tocState';

const tocStore = useTocStore();

function buildToc() {
    const detailsList = document.querySelectorAll(
        '#main-content details',
    ) as NodeListOf<HTMLElement>;
    const items = [];
    let idx = 0;

    for (const details of detailsList) {
        const summary = details.querySelector(':scope > summary');
        const text = summary?.textContent?.trim();
        if (!text) continue;

        if (!details.id) {
            details.id = 'toIdx-' + idx;
        }

        let level = 1;
        let parent = details.parentElement;
        while (parent) {
            if (parent.tagName === 'DETAILS') level++;
            parent = parent.parentElement;
        }

        items.push({ text, href: '#' + details.id, level, active: false });
        idx++;
    }

    tocStore.setItems(items);
}

onMounted(() => {
    buildToc();
});

onUnmounted(() => {
    tocStore.clear();
});
</script>
