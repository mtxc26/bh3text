<script setup lang="ts">
import { ref, watch } from 'vue';
import { DialogView } from 'vue-dialog-view/cssless';
import type { CookieConsent } from '@/consent/types';

const emit = defineEmits<{
    doNotSell: [];
    openPreferences: [];
    closed: [];
}>();

const open = ref(false);

function show() {
    open.value = true;
}

function close() {
    open.value = false;
}

watch(open, (v) => {
    if (!v) emit('closed');
});

defineExpose({ show, close });
</script>

<template>
    <DialogView v-model="open">
        <template #title>Your Privacy Choices</template>
        <div class="section">
            <button class="link-btn" @click="emit('doNotSell')">Do Not Sell My Personal Information</button>
        </div>
        <div class="section">
            <button class="link-btn" @click="emit('openPreferences')">
                <span>Cookies Preferences</span>
                <span class="arrow">›</span>
            </button>
        </div>
        <div class="section">
            <a class="link-btn" href="/about/privacy.html" style="text-decoration: none; color: inherit">
                <span>Privacy Policy</span>
                <span class="arrow">›</span>
            </a>
        </div>
        <div class="close-row">
            <button class="btn-close" @click="open = false">关闭</button>
        </div>
    </DialogView>
</template>

<style scoped>
.section {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
}
.section:last-child {
    margin-bottom: 0;
}
.link-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
    color: #333;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
}
.link-btn:hover {
    background: #f0f0f0;
}
.arrow {
    color: #999;
    font-size: 16px;
}
.close-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
.btn-close {
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: #f0f0f0;
    color: #333;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
}
.btn-close:hover {
    opacity: 0.85;
}
</style>
