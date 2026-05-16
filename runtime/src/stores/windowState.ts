import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useWindowStateStore = defineStore('WindowState', {
    state: () => ({
        width: 0,
        height: 0,
    }),
    actions: {
        updateWindowSize(w: number, h: number) {
            this.width = w;
            this.height = h;
        },
    },
    getters: {
        isMobile(): boolean {
            return this.width < 640;
        },

        isTablet(): boolean {
            return this.width >= 640 && this.width < 768;
        },

        isDesktop(): boolean {
            return this.width >= 768;
        },

        isSmallScreen(): boolean {
            return this.isMobile;
        },

        isLargeScreen(): boolean {
            return this.isDesktop || this.isTablet;
        },
    },
});
