export const getUrl = async (req, res, p, resortName) => {
	try {
		const url = 'https://www.snow-forecast.com/countries';

		var browser = await p.launch({
			headless: 'new',
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
