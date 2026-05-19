<template>
    <div class="settings-container">
        <DialogView v-model="appState.settingDialogOpen" class="a">
            <template #title>设置</template>

            <div class="settings-panel-group">
                <div class="title">通用选项</div>
                <!-- TODO: 主题切换（深他模式/浅色模式） -->
                <div class="row"><a-check :checked="rememberScrollPos" @update:checked="toggleScrollPos">记住上次阅读的位置</a-check> <a-button type="link" style="padding: 0" @click.prevent.stop="clearScrollPos">(清除所有记录)</a-button></div>
            </div>

            <div class="settings-panel-group">
                <div class="title">高级选项</div>
                <div class="row"><a-check :checked="enableCgPreview" @update:checked="toggleCgPreview">启用过场动画预览（实验性）</a-check></div>
            </div>

            <div class="settings-panel-group">
                <div class="title">其他选项</div>
                <div class="row"><a-button @click="((appState.settingDialogOpen = false), vm.showPrivacyCenter())">您的隐私选项</a-button></div>
                <div class="row">
                    <a-button danger @click="clearCache" :disabled="clearCache__state === 2">{{ clearCache__state ? (clearCache__state === 2 ? '正在清除…' : '确定吗？') : '清除缓存' }}</a-button>
                </div>
            </div>
        </DialogView>
    </div>
</template>

<script setup lang="ts">
import { useAppStateStore } from '@/stores/appState';
import { onMounted, ref, watch } from 'vue';
import { Button as AButton, Checkbox as ACheck, Modal } from 'ant-design-vue';
import { DialogView } from 'vue-dialog-view/cssless';
import { runtime_vm as vm } from '@/app';
import { db } from '@/data';

const appState = useAppStateStore();

onMounted(() => init());

const init = async () => {
    rememberScrollPos.value = (await db.get('config', 'user.pref.state.scroll_pos_restore')) === false ? false : true;
    enableCgPreview.value = ((await db.get('config', 'user.pref.ui.cgview.allow_render'))) === false ? false : true;
};

// ------
// Generic

const rememberScrollPos = ref(true);
const toggleScrollPos = async (newValue: boolean) => {
    await db.put('config', newValue, 'user.pref.state.scroll_pos_restore');
    await init();
};
const clearScrollPos = async () => {
    await db.delete('pref', 'app.history.scroll_pos');

    appState.settingDialogOpen = false;
    Modal.success({
        title: '清除滚动位置记录',
        content: '成功。',
        okText: '好',
    });
};

// ------
// Advanced

const enableCgPreview = ref(true);
const toggleCgPreview = async (newValue: boolean) => {
    await db.put('config', newValue, 'user.pref.ui.cgview.allow_render');
    await init();
};

// ------
// Other

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
.settings-panel-group {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin-bottom: 1em;
}
.settings-panel-group > .title {
    font-weight: 600;
    font-size: 1.05em;
    padding-bottom: 4px;
}
</style>
