import contact_email from '@/elements/contact-email'
import error_handler from '@/utils/appFatalErrorHandler'

((async function () { contact_email.setup() })()).catch(error_handler);
