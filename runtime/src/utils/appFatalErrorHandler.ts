import { CanReport } from "@/statistics/main";

export default async function handleFatalError(e: any) {
    if (CanReport) {
        const Sentry = await import('@sentry/browser');
        const evtId = Sentry.captureException(e, {

        });

        // if report success, no longer throw to global
        // to avoid duplicate event
        if (evtId) return console.error(e);
    }
	throw e
}

