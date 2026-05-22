export const capability = {
	"browserName": "Chrome",
	"browserVersion": "144.0",
	"LT:Options": {
		"video": true,
		"platform": "Windows 10",
		"tunnel": false,
		"console": true,
		'build': 'Playwright Sample Build',
		'name': 'Playwright Sample Test',
		'user': process.env.LT_USERNAME,
		'accessKey': process.env.LT_ACCESS_KEY,
		'network': true,
	}
}