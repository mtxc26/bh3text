import { readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import obfuscator from 'javascript-obfuscator'

const distDir = 'src/local-private-dist/'
const files = readdirSync(distDir).filter(f => f.endsWith('.js'))
const filesSrc = readdirSync('src/local-private')
const isNodejs = _ => _.endsWith('.node.js')
const isNotNodejs = _ => !isNodejs(_)

const filesToExec = filesSrc.filter(isNodejs)
const filesToCp = filesSrc.filter(isNotNodejs)

for (const file of filesToCp) { const srcPath = join('src/local-private', file); const destPath = join(distDir, file); copyFileSync(srcPath, destPath) }

for (const file of filesToExec) {
    if (spawnSync('node', ['src/local-private/' + file], { stdio: 'inherit', encoding: 'utf-8' }).status) throw new Error('failed')
}


const OCFG = {
	target: 'browser',
	seed: 20260508,
	stringArray: !true,
	stringArrayEncoding: ['rc4'],
	stringArrayThreshold: 0,//1,
	splitStrings: !true,
	splitStringsChunkLength: 0,//10,
	compact: true,
	transformObjectKeys: false,
	controlFlowFlattening: !true,
	controlFlowFlatteningThreshold: 1,
	deadCodeInjection: !true,
	sourceMap: true,
	identifierNamesGenerator: 'mangled-shuffled',
}



for (const file of files) {
	const inputPath = join(distDir, file)
	const code = readFileSync(inputPath, 'utf-8')

	writeFileSync(inputPath, '// @ts-nocheck\n' + (obfuscator.obfuscate(code, OCFG).getObfuscatedCode()) /*+ '\n//# sourceMappingURL=' + file + '.map'*/, 'utf-8')
	//writeFileSync(inputPath + '.map', result.getSourceMap(), 'utf-8')
}

