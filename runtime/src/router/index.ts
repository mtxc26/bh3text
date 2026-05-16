import { getRouteHref } from '@/utils/route_href';
import { createRouter, createWebHistory, type RouteLocationNormalizedLoadedGeneric } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/Home.vue'),
        },
        {
            path: '/search/',
            name: 'search',
            component: () => import('@/views/Search.vue'),
        },
        {
            path: '/dialog/',
            name: 'dialog-index',
            component: () => import('@/views/DialogIndex.vue'),
            meta: {
                SHOW_EXPAND_BTN: true,
            },
        },
        {
            path: '/dialog/:pathMatch(.*)+',
            name: 'dialog-page',
            component: () => import('@/views/DialogPage.vue'),
            props: true,
            meta: {
                SHOW_EXPAND_BTN: true,
            },
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/NotFound.vue'),
        },
    ],
});

export default router;

// currently the website has partial SPA support
// so we transform SPA navigation to native
(function () {
    let count = 0;
    router.afterEach((to, from) => {
        if (++count < 2) return; // first load should not trigger redirect
        const oldUrl = getRouteHref(from),
            newUrl = getRouteHref(to);
        if (oldUrl.href === newUrl.href) return;
        window.location.href = newUrl.href;
    });
})();
