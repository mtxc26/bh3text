import {
    ref,
    computed
} from 'vue'
import {
    defineStore
} from 'pinia'

export const useAppStateStore = defineStore('AppState', {
    state: () => ({
        sidebarOpen: false,
    }),
})