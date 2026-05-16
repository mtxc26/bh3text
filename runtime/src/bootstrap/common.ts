import { common_main } from '@/main';
import error_handler from '@/utils/appFatalErrorHandler';

common_main()
    .then(() => console.log('[common]', 'init success'))
    .catch(error_handler);
