/**
 * Global Privacy Control (GPC) detection.
 * When enabled, the browser signals "Do Not Sell/Share My Personal Information".
 *
 * Reference: https://globalprivacycontrol.org/
 */

/**
 * Check if GPC is enabled via the navigator API.
 * Returns true when the user has enabled GPC in their browser.
 */
export function isGPCEnabled(): boolean {
    try {
        // @ts-ignore - globalPrivacyControl is not in standard TS types yet
        return navigator.globalPrivacyControl === true;
    } catch {
        return false;
    }
}
