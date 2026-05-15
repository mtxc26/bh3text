import a11y_helper from '@/elements/a11y-helper'
import error_handler from '@/utils/appFatalErrorHandler'

((async function () { a11y_helper.setup() })()).catch(error_handler);
