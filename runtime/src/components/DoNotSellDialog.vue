<script setup lang="ts">
import { ref, computed } from 'vue';
import { Modal } from 'ant-design-vue';
import { DialogView } from 'vue-dialog-view/cssless';
import type { CookieConsent } from '@/consent/types';
import { readConsent, writeConsent } from '@/consent/manager';
import { isGPCEnabled } from '@/consent/gpc';

const emit = defineEmits<{ confirmed: [] }>();

const open = ref(false);
const ns = ref(true);
const gpcEnabled = computed(() => isGPCEnabled());
let _resolve: ((v: boolean) => void) | null = null;
let _confirmed = false;

function show(): Promise<boolean> {
    _confirmed = false;
    // When GPC is enabled, ns is forced to true
    ns.value = gpcEnabled.value ? true : !!readConsent()?.ns;
    open.value = true;
    return new Promise((r) => {
        _resolve = r;
    });
}

function confirm() {
    const current = readConsent();
    const consent: CookieConsent = {
        n: true,
        f: current?.f ?? true,
        p: ns.value ? false : (current?.p ?? false),
        t: ns.value ? false : (current?.t ?? false),
        ns: ns.value,
    };
    writeConsent(consent);
    _confirmed = true;
    emit('confirmed');
    open.value = false;
}

function cancel() {
    _confirmed = false;
    open.value = false;
}

function onClosed() {
    if (_resolve) {
        _resolve(_confirmed);
        _resolve = null;
    }
    if (_confirmed) {
        setTimeout(() => {
            Modal.confirm({
                title: '需要重新加载页面',
                content: '隐私偏好已保存。部分更改需要重新加载页面才能生效，是否立即重新加载？',
                okText: '立即重新加载',
                cancelText: '稍后',
                onOk() {
                    location.reload();
                },
            });
        });
    }
}

defineExpose({ show });
</script>

<template>
    <DialogView v-model="open" @closed="onClosed">
        <template #title>Do Not Sell My Personal Information</template>
        <label class="option" :class="{ 'gpc-locked': gpcEnabled }">
            <input type="checkbox" v-model="ns" :disabled="gpcEnabled" />
            <div class="option-body">
                <div class="option-label">Do Not Sell My Personal Information</div>
                <div v-if="gpcEnabled" class="gpc-hint">您的浏览器已启用 Global Privacy Control (GPC)，此选项将被强制开启。</div>
            </div>
        </label>
        <div class="actions">
            <button class="btn btn-primary" @click="confirm">Apply</button>
            <button class="btn btn-secondary" @click="cancel">Discard</button>
        </div>
    </DialogView>
</template>

<style scoped>
.dns-desc {
    font-size: 14px;
    color: #666;
    margin: 0 0 20px;
    line-height: 1.5;
}
.option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
    margin-bottom: 20px;
}
.option input[type='checkbox'] {
    margin-top: 2px;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    cursor: pointer;
}
.option-body {
    flex: 1;
}
.option-label {
    font-size: 14px;
    font-weight: 600;
}
.option-desc {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
    line-height: 1.4;
}
.actions {
    display: flex;
    gap: 8px;
}
.btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
}
.btn:hover {
    opacity: 0.85;
}
.btn-primary {
    background: #4a90d9;
    color: #fff;
}
.btn-secondary {
    background: #f0f0f0;
    color: #333;
}.gpc-locked {
    border-color: #4a90d9;
    background: #f0f6ff;
}
.gpc-hint {
    font-size: 12px;
    color: #4a90d9;
    margin-top: 6px;
    line-height: 1.4;
}
</style>
