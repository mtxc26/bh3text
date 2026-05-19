<template>
    <div class="sidebar-wrapper">
        <a-drawer class="a-drawer sidebar" :width="Math.min(windowState.width, 250)" :headerStyle="{ padding: '0.5em 1em', border: '0' }" :bodyStyle="{ padding: 0, display: 'flex', flexDirection: 'column' }" placement="left" :closable="false" :open="appState.sidebarOpen" @close="appState.sidebarOpen = false">
            <template #title>
                <div class="header" v-if="prevUrl">
                    <a-button type="link" style="padding: 0" @click="goPrev"
                        ><span>{{ prevPageText || '< 返回' }}</span></a-button
                    >
                </div>
            </template>
            <template #extra>
                <a-button type="text" shape="circle" @click="appState.settingDialogOpen = !appState.settingDialogOpen" aria-label="打开设置对话框" title="设置">
                    <SettingOutlined />
                </a-button>
                <a-button type="text" shape="circle" @click="appState.sidebarOpen = !appState.sidebarOpen" aria-label="收起侧边栏" title="收起">
                    <CaretLeftFilled />
                </a-button>
            </template>
            <div class="row content-head">
                <a-button type="dashed" @click="back" v-if="canBack" style="flex: initial">后退</a-button>
                <a-button type="dashed" @click="go('/')">回到首页</a-button>
            </div>
            <div class="content" id="vapp-sidebar-contents-renderer">
                <nav v-if="tocStore.items.length" class="toc-nav" aria-label="目录">
                    <ul class="toc-list" role="list">
                        <li v-for="(item, index) in tocStore.items" :key="index" :class="['toc-item', { 'toc-current': item.active }]" role="listitem" :aria-level="item.level">
                            <a
                                :href="item.href"
                                class="toc-link"
                                :data-level="item.level"
                                :style="{
                                    paddingLeft: TOC_INDENT_BASE + (item.level - 1) * TOC_INDENT_PER_LEVEL + 'px',
                                }"
                                @click.prevent="scrollToToc(item)"
                            >
                                {{ item.text }}
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div class="content-bottom">
                <div class="nav-links-container" v-if="navPrev || navNext">
                    <a v-if="navPrev" :href="navPrev.url" @click.prevent="goNav(navPrev.url)">{{ navPrev.title }}</a>
                    <a v-if="navNext" class="btn-right" :href="navNext.url" @click.prevent="goNav(navNext.url)">{{ navNext.title }}</a>
                </div>
            </div>
        </a-drawer>

        <float-button @click="appState.sidebarOpen = !appState.sidebarOpen" v-if="!appState.sidebarOpen && !hideExpandBtn" class="sidebar-expand" aria-label="展开侧边栏" title="展开">
            <template #icon>
                <MenuOutlined />
            </template>
        </float-button>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button as AButton, Drawer as ADrawer, FloatButton } from 'ant-design-vue';
import { CaretLeftFilled, LeftOutlined, MenuOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { useAppStateStore } from '@/stores/appState';
import { useWindowStateStore } from '@/stores/windowState';
import { useTocStore, type TocItem } from '@/stores/tocState';

const route = useRoute();
const router = useRouter();

const appState = useAppStateStore();
const windowState = useWindowStateStore();
const tocStore = useTocStore();

const TOC_INDENT_BASE = 8;
const TOC_INDENT_PER_LEVEL = 16;

const hideExpandBtn = computed(() => !(route.meta as any)?.SHOW_EXPAND_BTN);

const go = (path: string) => {
    router.push(path);
    appState.sidebarOpen = false;
};

const back = () => {
    router.back();
};

const canBack = ref(false);

const prevUrl = ref<string | null>(null);
const prevPageText = ref('');
const goPrev = () => prevUrl.value && goNav(prevUrl.value);
const navPrev = ref<{ url: string; title: string } | null>(null);
const navNext = ref<{ url: string; title: string } | null>(null);

const goNav = (url: string) => {
    try {
        const u = new URL(url);
        if (u.origin === window.location.origin) {
            router.push(u.pathname + u.search + u.hash);
        } else {
            window.location.href = url;
        }
    } catch {
        window.location.href = url;
    }
};

const scrollToToc = (item: TocItem) => {
    appState.sidebarOpen = false;
    const el = document.querySelector(item.href);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// onMounted(() => {
router.afterEach(() => {
    // // @ts-ignore
    // canBack.value = (typeof navigation === 'object') ? (window.navigation?.canGoBack ?? true) : (history.length > 1);
    // let count = 0;
    // router.afterEach(() => {
    //     if (++count < 2) return;
    //     canBack.value = true;
    // })
    // router.afterEach(() => {
    // @ts-ignore
    canBack.value = typeof navigation === 'object' ? (window.navigation?.canGoBack ?? true) : history.length > 1;
    // })
    const prevEl = document.querySelector('nav a.nav-up') as HTMLElement;
    if (prevEl && prevEl.getAttribute('href')) {
        prevUrl.value = new URL(prevEl.getAttribute('href')!, location.href).href;
        prevPageText.value = prevEl.textContent;
    } else {
        prevUrl.value = null;
        prevPageText.value = '';
    }

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
});
</script>

<style scoped>
.content {
    padding: 0.5em 10px;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    flex: 1;
    overflow: auto;
}
.sidebar-expand {
    right: unset;
    bottom: unset;
    left: 1em;
    top: 1em;
}
.header-btn > * {
    display: inline-block;
    margin: auto;
}
.header-btn {
    display: inline-flex;
    height: 32px;
    text-align: center;
    font-size: small;
}
.row {
    display: flex;
    gap: 0.5em;
}
.row > * {
    flex: 1;
}
.row {
    padding: 0 10px;
}
.content .row {
    padding: 0;
}
.content-head,
.content-bottom {
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    --bs: 1px solid var(--color-separator);
}
.content-head {
    border-bottom: var(--bs);
}
.content-bottom {
    border-top: var(--bs);
}
.content-bottom:empty {
    display: none;
}
.nav-links-container {
    display: flex;
    flex-direction: row;
    gap: 0.5em;
    padding: 0 10px;
}
.nav-links-container > * {
    flex: 1;
}
.nav-links-container > .btn-right {
    text-align: right;
}
.nav-links-container > a {
    color: #1677ff;
    padding: 0.5em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.toc-link {
    display: block;
    padding: 6px 8px;
    font-size: 14px;
    line-height: 1.4;
    color: var(--color-text-secondary, #666);
    text-decoration: none;
    border-radius: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    outline: none;
    transition: all 0.15s;
}
.toc-link:hover {
    background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
    color: var(--color-text-primary, #333);
}
.toc-link:focus-visible {
    box-shadow: 0 0 0 2px var(--color-primary, #1677ff);
    background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
    color: var(--color-text-primary, #333);
}
.toc-current .toc-link {
    color: var(--color-primary, #1677ff);
    font-weight: 600;
    background: var(--color-primary-bg, rgba(22, 119, 255, 0.06));
}
</style>
