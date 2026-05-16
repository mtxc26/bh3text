<template>
    <div class="settings-container">
        <DialogView v-model="appState.settingDialogOpen" class="a">
            <template #title>设置</template>

            <div class="settings-panel-content">
                <a-button danger @click="clearCache" :disabled="clearCache__state === 2">{{ clearCache__state ? (clearCache__state === 2 ? '正在清除…' : '确定吗？') : '清除缓存' }}</a-button>
            </div>
        </DialogView>
    </div>
</template>

<script setup lang="ts">
import { useAppStateStore } from '@/stores/appState';
import { ref, watch } from 'vue';
import { Button as AButton, Modal } from 'ant-design-vue';
import { DialogView } from 'vue-dialog-view/cssless';

const appState = useAppStateStore();

const clearCache__state = ref(0);
const clearCache = async function () {
    if (!clearCache__state.value) {
        clearCache__state.value = 1;
        return;
    }
    clearCache__state.value = 2;
    try {
        const resp = await fetch('/cgi/clear_cache.do', { cache: 'no-store' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        Modal.success({
            title: '清除缓存',
            content: '成功。',
            okText: '好',
        });
    } catch (e) {
        Modal.success({
            title: '清除缓存失败',
            content: String(e),
            okText: '好',
        });
    } finally {
        appState.settingDialogOpen = false;
    }
};

watch(
    () => appState.settingDialogOpen,
    () => (clearCache__state.value = 0),
);
</script>

<style scoped>
.settings-container > .a {
    width: 100%;
    height: 100%;
}
</style>
