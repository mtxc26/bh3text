<script setup lang="ts">
import { ref } from 'vue';
import type { CookieConsent } from '@/consent/types';
import { getConsent } from '@/consent/cookie';
import CookieConsentDialog from './components/CookieConsentDialog.vue';
import DoNotSellDialog from './components/DoNotSellDialog.vue';
import PrivacyConsentCenter from './components/PrivacyConsentCenter.vue';

const cookieDialog = ref<InstanceType<typeof CookieConsentDialog>>();
const dnsDialog = ref<InstanceType<typeof DoNotSellDialog>>();
const center = ref<InstanceType<typeof PrivacyConsentCenter>>();

let _centerResolve: ((v: CookieConsent) => void) | null = null;

function showConsentDialog(existing?: CookieConsent) {
    return cookieDialog.value!.show(existing);
}

function showPrivacyCenter() {
    center.value!.show();
    return new Promise<CookieConsent>((r) => {
        _centerResolve = r;
    });
}

async function onDoNotSell() {
    await dnsDialog.value!.show();
}

async function onOpenPreferences() {
    const consent = await cookieDialog.value!.show((await getConsent()) ?? undefined);
    if (_centerResolve) {
        _centerResolve(consent);
        _centerResolve = null;
    }
}

async function onCenterClosed() {
    const consent = (await getConsent()) ?? { n: true, f: false, p: false, t: false };
    if (_centerResolve) {
        _centerResolve(consent);
        _centerResolve = null;
    }
}

defineExpose({ showConsentDialog, showPrivacyCenter });
</script>

<template>
    <CookieConsentDialog ref="cookieDialog" @saved="center?.close()" />
    <DoNotSellDialog ref="dnsDialog" @confirmed="center?.close()" />
    <PrivacyConsentCenter
        ref="center"
        @do-not-sell="onDoNotSell"
        @open-preferences="onOpenPreferences"
        @closed="onCenterClosed"
    />
</template>
