import { runtime_vm as vm } from '@/app';
import { readConsent, writeConsent, renewConsent, _setInit } from './manager';
import { getUserCountry } from '@/utils/usercountry';
import { isGPCEnabled } from './gpc';
import type { CookieConsent } from './types';

export type { CookieConsent } from './types';
export { getConsent, setConsent, hasConsent } from './manager';

export function setupCookieConsent(): Promise<CookieConsent> {
    const init = _setupCookieConsent();
    _setInit(init.then(() => {}));
    return init;
}

async function _setupCookieConsent(): Promise<CookieConsent> {
    renewConsent();
    const existing = readConsent();
    const gpc = isGPCEnabled();

    if (existing) {
        if (!existing._a) {
            // existing consent from dialog — ensure GPC is respected
            if (gpc && !existing.ns) {
                writeConsent({ ...existing, ns: true });
                return readConsent()!;
            }
            return existing;
        }
        const country = await getUserCountry();
        if (country === 'CN') {
            writeConsent({ n: true, f: true, p: true, t: true, _a: true });
            return readConsent()!;
        }
        // re-consent for non-CN users; respect GPC
        writeConsent({ n: true, f: false, p: false, t: false, ns: gpc || undefined });
        return (vm as any).showConsentDialog();
    }

    const country = await getUserCountry();
    if (country === 'CN') {
        const c: CookieConsent = { n: true, f: true, p: true, t: true, _a: true };
        writeConsent(c);
        return c;
    }

    // no existing consent — pre-set ns if GPC is enabled
    if (gpc) {
        writeConsent({ n: true, f: false, p: false, t: false, ns: true });
    }
    return (vm as any).showConsentDialog();
}

export function showConsentDialog(): Promise<CookieConsent> {
    return (vm as any).showConsentDialog(readConsent() ?? undefined);
}
