import { execSync } from 'node:child_process';

console.log('Building data submodule...');
execSync('npm run build2', { cwd: 'data', stdio: 'inherit' });
console.log('Submodule build done.');
