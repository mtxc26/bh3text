const SESSION_KEY = 'user_country'

export async function getUserCountry(): Promise<string | null> {
	const cached = sessionStorage.getItem(SESSION_KEY)
	if (cached !== null) return cached || null
	try {
		const text = await (await fetch('https://cfstat.bh3text.com/cdn-cgi/trace')).text()
		const m = text.match(/^loc=(.+)$/m)
		const country = m?.[1] ?? null
		if (country) sessionStorage.setItem(SESSION_KEY, country)
		else sessionStorage.setItem(SESSION_KEY, '')
		return country
	} catch {
		sessionStorage.setItem(SESSION_KEY, '')
		return null
	}
}
