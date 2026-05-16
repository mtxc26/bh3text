import { useWindowStateStore } from '@/stores/windowState';

export async function init() {
    const onResize = () => {
        const { updateWindowSize } = useWindowStateStore();
        updateWindowSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    onResize();
}
