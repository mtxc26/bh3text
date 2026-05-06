import { rm, mkdir, cp, readdir } from 'node:fs/promises';

const OUT_DIRS = [
    'dist/dialog/mainline/1',
    'dist/dialog/mainline/2',
    'dist/dialog/er',
    'dist/dialog/ex',
    'dist/dialog/ow',
    'dist/dialog/novel',
];

export async function prepare() {
    // 只清空内容，不删除 dist/ 本身
    // 这样即使有进程 CWD 在 dist/ 里面也不会炸
    try {
        const entries = await readdir('dist');
        for (const entry of entries) {
            await rm(`dist/${entry}`, { recursive: true, force: true });
        }
    } catch {
        // dist doesn't exist yet, create it
        await mkdir('dist', { recursive: true });
    }
    for (const d of OUT_DIRS) await mkdir(d, { recursive: true });
    await cp('page/r', 'dist/r', { recursive: true });
    await cp('robots.txt', 'dist/robots.txt');
    console.log('dist prepared.');
}
