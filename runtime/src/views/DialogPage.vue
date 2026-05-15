<template>
	<div></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useTocStore } from '@/stores/tocState';

const tocStore = useTocStore();
let observer: IntersectionObserver | null = null;
let sectionElements: HTMLElement[] = [];

function buildToc() {
	const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6') as NodeListOf<HTMLElement>;
	const items = [];
	let idx = 0;

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
	if (sectionElements.length === 0) return;
	let activeIdx = -1;
	let closestDist = Infinity;

	for (let i = 0; i < sectionElements.length; i++) {
		const rect = sectionElements[i]!.getBoundingClientRect();
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
	sectionElements = tocStore.items
		.map((item) => document.querySelector(item.href) as HTMLElement)
		.filter(Boolean);

	if (sectionElements.length === 0) return;

	observer = new IntersectionObserver(() => updateActive(), {
		rootMargin: '-100px 0px 0px 0px',
		threshold: [0, 0.25, 0.5, 0.75, 1],
	});

	sectionElements.forEach((el) => observer!.observe(el));
}

onMounted(() => {
	buildToc();
	setupObserver();
});

onUnmounted(() => {
	observer?.disconnect();
	tocStore.clear();
});
</script>

<style>
nav.page-nav {
	position: static;
	border-bottom: 0;
}
</style>
