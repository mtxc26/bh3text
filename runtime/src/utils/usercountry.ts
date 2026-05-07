let _cache: string | null = null

export async function getUserCountry(): Promise<string | null> {
	if (_cache !== null) return _cache
	try {
		const text = await (await fetch('https://cfstat.bh3text.com/cdn-cgi/trace')).text()
		const m = text.match(/^loc=(.+)$/m)
		_cache = m?.[1] ?? null
	} catch {
		_cache = null
	}
	return _cache
}
