<script setup lang="ts">
import { ref } from 'vue';
import { Modal } from 'ant-design-vue';
import { DialogView } from 'vue-dialog-view/cssless';
import { CONSENT_CATEGORIES } from '@/consent/types';
import type { CookieConsent, ConsentCategory } from '@/consent/types';
import { readConsent, writeConsent } from '@/consent/manager';

const emit = defineEmits<{ saved: [] }>();

const open = ref(false);
const consent = ref<CookieConsent>({ n: true, f: false, p: false, t: false });
let _resolve: ((v: CookieConsent) => void) | null = null;
let _saved = false;

function show(existing?: CookieConsent): Promise<CookieConsent> {
    _saved = false;
    if (existing) {
        const { _a: _, ...rest } = existing;
        consent.value = { ...rest };
    } else {
        consent.value = { n: true, f: false, p: false, t: false };
    }
    open.value = true;
    return new Promise((r) => {
        _resolve = r;
    });
}

function toggle(key: ConsentCategory, checked: boolean) {
    consent.value = { ...consent.value, [key]: checked };
    writeConsent(consent.value);
    consent.value = readConsent() ?? consent.value;
}

function save() {
    writeConsent(consent.value);
    _saved = true;
    emit('saved');
    open.value = false;
}

function rejectAll() {
    writeConsent({ n: true, f: false, p: false, t: false });
    consent.value = readConsent() ?? consent.value;
    _saved = true;
    emit('saved');
    open.value = false;
}

function onClosed() {
    if (_resolve) {
        _resolve({ ...consent.value });
        _resolve = null;
    }
    if (_saved) {
        setTimeout(() => {
            Modal.confirm({
                title: '需要重新加载页面',
                content: 'Cookie 偏好已保存。部分更改需要重新加载页面才能生效，是否立即重新加载？',
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
        <template #title>Cookie 偏好设置</template>
        <p class="dialog-desc">
            我们使用 Cookies 来改善您的浏览体验。您可以在此处选择允许的 Cookie 类别。
        </p>
        <ul class="categories">
            <li v-for="cat in CONSENT_CATEGORIES" :key="cat.key" class="category">
                <div class="category-body">
                    <div class="category-label">{{ cat.label }}</div>
                    <div class="category-desc">{{ cat.description }}</div>
                </div>
                <label class="toggle">
                    <input
                        type="checkbox"
                        :checked="consent[cat.key]"
                        :disabled="
                            cat.required || (!!consent.ns && (cat.key === 'p' || cat.key === 't'))
                        "
                        @change="toggle(cat.key, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="toggle-track"></span>
                </label>
            </li>
        </ul>
        <div class="actions">
            <div class="actions-row">
                <button class="btn btn-primary" @click="save">保存偏好</button>
                <button class="btn btn-secondary" @click="rejectAll">仅接受必要 Cookies</button>
            </div>
        </div>
    </DialogView>
</template>

<style scoped>
.dialog-desc {
    font-size: 14px;
    color: #666;
    margin: 0 0 20px;
    line-height: 1.5;
}
.categories {
    list-style: none;
    margin: 0;
    padding: 0;
}
.category {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
}
.category:last-child {
    border-bottom: none;
}
.category-body {
    flex: 1;
    min-width: 0;
}
.category-label {
    font-size: 14px;
    font-weight: 600;
}
.category-desc {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
}
.toggle {
    flex-shrink: 0;
    position: relative;
    width: 44px;
    height: 24px;
    display: block;
}
.toggle input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
}
.toggle input:disabled {
    cursor: not-allowed;
}
.toggle-track {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    background: #ccc;
    transition: background 0.2s;
}
.toggle input:checked + .toggle-track {
    background: #4a90d9;
}
.toggle input:disabled + .toggle-track {
    opacity: 0.6;
}
.toggle-track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle input:checked + .toggle-track::after {
    transform: translateX(20px);
}
.actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
}
.actions-row {
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
}
</style>
