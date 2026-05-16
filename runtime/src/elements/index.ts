import a11y_helper from './a11y-helper';
import contact_email from './contact-email';

export async function setup() {
    if (typeof customElements === 'undefined')
        try {
            console.warn(
                '[elements]',
                'Custom elements is NOT supported in this browser or context. Skipping components setup.',
            );
        } finally {
            return;
        }

    await a11y_helper.setup();
    await contact_email.setup();
}
