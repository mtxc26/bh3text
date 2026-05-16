import { rm, mkdir, cp, readdir } from 'node:fs/promises';

const OUT_DIRS = ['dist/dialog/mainline/1', 'dist/dialog/mainline/2', 'dist/dialog/er', 'dist/dialog/ex', 'dist/dialog/ow', 'dist/dialog/novel', 'dist/_r/worker'];

export async function prepare() {
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
    await cp('runtime/dist', 'dist/_r/runtime', { recursive: true });
    await cp('runtime/src/local-private-dist/contact-emails.js', 'dist/_r/worker/contact-emails_v1.js');
    await cp('public', 'dist', { recursive: true });
    console.log('dist prepared.');
}
