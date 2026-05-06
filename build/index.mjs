import { prepare } from './prepare.mjs';
import { dialog } from './dialog.mjs';
import { pages } from './pages.mjs';
import { sitemap } from './sitemap.mjs';

console.log('Preparing dist...');
await prepare();

console.log('\nGenerating dialog pages...');
await dialog();

console.log('\nGenerating index pages...');
await pages();

console.log('\nGenerating sitemap...');
await sitemap();

console.log('\n🎉 Build done.');
