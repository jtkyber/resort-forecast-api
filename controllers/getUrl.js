// const getUrl = (req, request, cheerio, myCache) => {
// 	try {
// 		const name = req.params.resort.toLowerCase();
// 		if (myCache.has(name)) {
// 			return myCache.get(name);
// 		}

// 		const formattedName = name.replace(/ /g, '+');
// 		const googleSearch = `https://www.google.com/search?q=${formattedName}+snow+forecast+6day`;

// 		return new Promise(resolve => {
// 			request(googleSearch, (error, response, html) => {
// 				if (!error && response.statusCode == 200) {
// 					const $ = cheerio.load(html);

// 					$('a').each((i, el) => {
// 						const url = $(el).attr('href');
// 						console.log(url);
// 						if (i < 50) {
// 							if (url.includes('https://www.snow-forecast.com/resorts') && url.includes('6day')) {
// 								const urlRegex = /(https?:\/\/[^ ]*)/;
// 								const extractedUrl = url.match(urlRegex)[1];
// 								const splicedUrl = extractedUrl.slice(0, extractedUrl.lastIndexOf('/'));
// 								const finalUrl = splicedUrl;

// 								if (finalUrl.length > 43 && finalUrl.length < 100) {
// 									myCache.set(`${name}`, finalUrl);
// 									resolve(finalUrl);
// 									return false;
// 								}
// 							}
// 						} else resolve(false);
// 					});
// 					resolve(false);
// 				} else {
// 					throw new Error('Error');
// 				}
// 			});
// 		}).then(value => {
// 			return value;
// 		});
// 	} catch (err) {
// 		console.log(err, 'getUrl');
// 	}
// };

const getUrl = async (req, res, p, resortName) => {
	try {
		const url = 'https://www.snow-forecast.com/countries';

		var browser = await p.launch({
			headless: 'new',
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			// executablePath: '/usr/bin/google-chrome',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		const page = await browser.newPage();
		await page.setDefaultTimeout(60000);
		await page.setRequestInterception(true);

		//Skip loading of imgs/stylesheets/media
		page.on('request', request => {
			if (
				request.resourceType() === 'image' ||
				request.resourceType() === 'stylesheet' ||
				request.resourceType() === 'media' ||
				request.resourceType() === 'font'
			)
				request.abort();
			else request.continue();
		});

		await page.goto(url, { waitUntil: 'domcontentloaded' });

		await page.type('.page-header__search-input', resortName);
		await page.waitForSelector('.location-search-results-section-rows .result-entry');
		await page.keyboard.press('Enter');
		await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
		const newUrl = await page.url();

		let lastIndex = newUrl.lastIndexOf('/');
		const lastSection = newUrl.substring(lastIndex + 1);

		if (lastSection === 'bot' || lastSection === 'mid' || lastSection === 'top') {
			return newUrl.substring(0, lastIndex);
		}

		return newUrl;
	} catch (err) {
		console.log(err, 'getUrl');
	} finally {
		await browser?.close();
	}
};

module.exports = {
	getUrl,
};
