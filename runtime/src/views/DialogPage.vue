<template>
    <div>
        <Teleport :disabled="appState.disableAllTeleport || !pageFooterTarget" :to="pageFooterTarget">
            <div class="page-footer-nav" v-show="!!pageFooterTarget">
                <div class="nav-links-container" v-if="navPrev || navNext">
                    <a v-if="navPrev" :href="navPrev.url">{{ navPrev.title }}</a>
                    <div class="space"></div>
                    <a v-if="navNext" :href="navNext.url">{{ navNext.title }}</a>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTocStore } from '@/stores/tocState';
import { useAppStateStore } from '@/stores/appState';

const route = useRoute();
const router = useRouter();
const appState = useAppStateStore();

const pageFooterTarget = ref<HTMLElement | null>();
const navPrev = ref<{ url: string; title: string } | null>(null);
const navNext = ref<{ url: string; title: string } | null>(null);
watch(
    () => route.fullPath,
    () => {
        pageFooterTarget.value = document.getElementById('page-footer-nav-container');

        const prevLink = document.querySelector('nav.page-nav .nav-links a.nav-prev') as HTMLAnchorElement | null;
        if (prevLink?.getAttribute('href')) {
            navPrev.value = {
                url: new URL(prevLink.getAttribute('href')!, location.href).href,
                title: prevLink.textContent?.trim() || '',
            };
        }
        const nextLink = document.querySelector('nav.page-nav .nav-links a.nav-next') as HTMLAnchorElement | null;
        if (nextLink?.getAttribute('href')) {
            navNext.value = {
                url: new URL(nextLink.getAttribute('href')!, location.href).href,
                title: nextLink.textContent?.trim() || '',
            };
        }
    },
    { immediate: true },
);

const goNav = (url: string) => {
    router.push(url);
};

const tocStore = useTocStore();
const observer = ref<IntersectionObserver | null>();
const sectionElements = ref<HTMLElement[]>([]);

function buildToc() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>;
    const items = [];
    let idx = 0;
    tocStore.clear();

    for (const heading of headings) {
        const text = heading.textContent?.trim();
        if (!text) continue;

        if (!heading.id) {
            heading.id = 'toc-' + idx;
        }

        const level = parseInt(heading.tagName.charAt(1));
        items.push({ text, href: '#' + heading.id, level, active: false });
        idx++;
    }

    tocStore.setItems(items);
}

function updateActive() {
    if (sectionElements.value.length === 0) return;
    let activeIdx = -1;
    let closestDist = Infinity;

    for (let i = 0; i < sectionElements.value.length; i++) {
        const rect = sectionElements.value[i]!.getBoundingClientRect();
        if (rect.top <= 120) {
            const dist = 120 - rect.top;
            if (dist < closestDist) {
                closestDist = dist;
                activeIdx = i;
            }
        }
    }

    if (activeIdx === -1) activeIdx = 0;

    tocStore.setActive(tocStore.items[activeIdx]?.href || '');
}

function setupObserver() {
    sectionElements.value = tocStore.items.map((item) => document.querySelector(item.href) as HTMLElement).filter(Boolean);

    if (sectionElements.value.length === 0) return;

    observer.value = new IntersectionObserver(() => updateActive(), {
        rootMargin: '-100px 0px 0px 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    if (!observer.value) throw new Error();
    for (const el of sectionElements.value) observer.value.observe(el);
}

watch(
    () => route.fullPath,
    () => buildToc(),
    { immediate: true },
);

onMounted(() => {
    buildToc();
    setupObserver();
});

onBeforeUnmount(() => {
    observer.value?.disconnect();
    tocStore.clear();
});
</script>

<style scoped>
.page-footer-nav {
    margin-top: 1em;
    padding-top: 0.5em;
    border-top: 1px solid var(--color-separator);
}
.nav-links-container {
    display: flex;
    align-items: center;
    font-size: small;
}
.nav-links-container > .space {
    flex: 1;
}
</style>

<style>
nav.page-nav {
    position: static;
    border-bottom: 0;
}
:root.dialog-settings-no-copy-descriptive .dialog-descriptive {
    user-select: none;
}
:root.dialog-settings-no-synopsis .content.synopsis {
    display: none !important;
}
</style>
