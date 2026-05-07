import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import obfuscator from 'javascript-obfuscator'

const distDir = 'dist'
const files = readdirSync(distDir).filter(f => f.endsWith('.js'))

for (const file of files) {
	const inputPath = join(distDir, file)
	const code = readFileSync(inputPath, 'utf-8')
	const result = obfuscator.obfuscate(code, {
		target: 'browser',
		seed: 20260507,
		stringArray: true,
		stringArrayEncoding: ['rc4'],
		stringArrayThreshold: 1,
		splitStrings: true,
		splitStringsChunkLength: 10,
		compact: true,
		transformObjectKeys: true,
		controlFlowFlattening: true,
		controlFlowFlatteningThreshold: 1,
		deadCodeInjection: true,
		sourceMap: true,
		identifierNamesGenerator: 'mangled-shuffled',
	})

	writeFileSync(inputPath, result.getObfuscatedCode() /*+ '\n//# sourceMappingURL=' + file + '.map'*/, 'utf-8')
	//writeFileSync(inputPath + '.map', result.getSourceMap(), 'utf-8')
}
