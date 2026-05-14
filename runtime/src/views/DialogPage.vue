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
	const items = [];

	const h1 = document.querySelector('#page-title');
	if (h1 instanceof HTMLElement && h1.textContent?.trim()) {
		items.push({
			text: h1.textContent.trim(),
			href: '#main-content',
			level: 1,
			active: false,
		});
	}

	const stages = document.querySelectorAll('section.stage[id]') as NodeListOf<HTMLElement>;
	for (const section of stages) {
		const step = section.querySelector('h2.step');
		const text = step?.textContent?.trim();
		if (!text) continue;

		items.push({
			text,
			href: '#' + section.id,
			level: 2,
			active: false,
		});
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
