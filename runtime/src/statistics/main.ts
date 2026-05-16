import { hasConsent } from '@/consent/cookie';

const PROD_HOST = '.bh3text.com';

function isProd(): boolean {
    const host = location.hostname;
    return '.' + host === PROD_HOST || host.endsWith(PROD_HOST);
}

export let CanReport = false;

export async function setupStatistics() {
    if (!isProd() || !(await hasConsent('p'))) return;

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', '{"token": "396dde6ebb1a462fa555614d7e175e7d"}');
    document.head.appendChild(script);

    const Sentry = await import('@sentry/browser');

    Sentry.init({
        dsn: 'https://daff9f915d009c11c335a0fbecdcb940@o4511395044851712.ingest.de.sentry.io/4511395094986832',
        // Setting this option to true will send default PII data to Sentry.
        // For example, automatic IP address collection on events
        sendDefaultPii: (await hasConsent('t')) ? true : false,
    });

    CanReport = true;
}
