<template>
    <div>
        <Teleport :disabled="appState.disableAllTeleport || !searchFormTarget" :to="searchFormTarget">
            <div class="search-form-container" v-show="!!searchFormTarget">
                <component is="style">#search-form-main { display: none !important; }</component>
                <form action="/search/" method="GET" role="search" class="search-form" ref="searchForm">
                    <a-input-search
                        id="search-keyword"
                        name="q"
                        placeholder="输入关键词搜索..."
                        autocomplete="on"
                        enter-button="搜索"
                        @search="onSearch"
                    />
                    <a-collapse ghost :expand-icon-position="'end'" class="search-options">
                        <template #expandIcon="props">
                            <caret-right-outlined :rotate="(props as any).isActive ? 90 : 0" />
                        </template>
                        <a-collapse-panel key="options" header="更多选项">
                            <div class="search-options-content">
                                <a-input
                                    id="search-actor-filter"
                                    name="a"
                                    placeholder="按角色筛选..."
                                    autocomplete="on"
                                    allow-clear
                                />
                                <div class="search-option">
                                    <a-checkbox name="regex" :value="1">
                                        正则表达式搜索
                                    </a-checkbox>
                                </div>
                                <a-input
                                    id="search-regex-flags"
                                    name="flags"
                                    placeholder="正则表达式标志，如 igmsu"
                                    autocomplete="on"
                                    allow-clear
                                />
                            </div>
                        </a-collapse-panel>
                    </a-collapse>
                </form>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStateStore } from '@/stores/appState';
import { Input, Collapse, Checkbox } from 'ant-design-vue';
import { CaretRightOutlined } from '@ant-design/icons-vue';

const AInput = Input;
const AInputSearch = Input.Search;
const ACollapse = Collapse;
const ACollapsePanel = Collapse.Panel;
const ACheckbox = Checkbox;

const route = useRoute();
const appState = useAppStateStore();

const searchFormTarget = ref<HTMLElement | null>();
const searchForm = ref<HTMLFormElement>();

watch(
    () => route.fullPath,
    () => {
        searchFormTarget.value = document.getElementById('search-form-js-container');
    },
    { immediate: true },
);

watch(searchFormTarget, (target) => {
    if (target) {
        nextTick(() => {
            const input = document.getElementById('search-keyword') as HTMLInputElement;
            input?.focus();
        });
    }
});

const onSearch = () => {
    searchForm.value?.submit();
};
</script>

<style scoped>
.search-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.search-options-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 !important;
}
.search-option {
    display: flex;
    align-items: center;
}
.search-options :deep(.ant-collapse-header) {
    padding: 8px 0 !important;
}
.search-options :deep(.ant-collapse-content-box) {
    padding: 8px 0 0 0 !important;
}
.search-options :deep(.ant-collapse-item) {
    border-bottom: 0 !important;
}
.search-options :deep(.ant-input-wrapper) {
    border: 0 !important;
}
.search-options :deep(.ant-input) {
    border: 1px solid #d9d9d9 !important;
    box-shadow: none !important;
}
.search-options :deep(.ant-input-affix-wrapper) {
    border: 1px solid #d9d9d9 !important;
    box-shadow: none !important;
    padding: 4px 11px !important;
}
</style>