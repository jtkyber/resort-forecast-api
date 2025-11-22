const getRegions = async page => {
	const regions = await page.$$eval('#content-container #content .countries-list a', options => {
		let regionsTemp = [];

		for (let option of options) {
			const href = option.href;
			if (!href) continue;

			const startString = 'countries/';
			const endString = '/resorts';

			const startIndex = href.indexOf(startString);
			if (startIndex === -1) return null;

			const actualStartIndex = startIndex + startString.length;
			const endIndex = href.indexOf(endString, actualStartIndex);
			if (endIndex === -1) return null;

			const regionName = href.substring(actualStartIndex, endIndex);

			if (regionName) regionsTemp.push(regionName);
		}
		return regionsTemp;
	});
	return regions;
};

const getResorts = async (page, region = false) => {
	try {
		const resortObject = {};
		// Get all region values
		const regions = await getRegions(page);

		for (let i = 0; i < regions.length; i++) {
			const regionName = regions[i];

			if (region && region !== regionName) continue;

			await page.goto(`https://www.snow-forecast.com/countries/${regionName}/resorts`, {
				waitUntil: 'domcontentloaded',
			});

			const resortNames = await page.$$eval('.digest-cont .my-digest .digest-row .name > a', options => {
				return options.map(option => option.innerText);
			});

			resortObject[regionName] = resortNames;

			const urls = await page.$$eval('#ctry_tabs_cont a', tabs => {
				return tabs.map(a => {
					const href = a.href;
					const lastIndex = href.lastIndexOf('/');
					const tabValue = href.substring(lastIndex + 1);

					if (tabValue === 'powder') return null;
					return href;
				});
			});

			for (const url of urls) {
				if (!url) continue;

				await page.goto(url, {
					waitUntil: 'domcontentloaded',
				});

				const resortNames = await page.$$eval('.digest-cont .my-digest .digest-row .name > a', options => {
					return options.map(option => option.innerText);
				});

				resortObject[regionName].push(...resortNames);
			}
		}

		return resortObject;
	} catch (err) {
		console.log(err, 'clickUnitButton');
	}
};

const resorts = async (req, res, p, flag) => {
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

		// page.on('console', async msg => {
		// 	const msgArgs = msg.args();
		// 	const logValues = await Promise.all(msgArgs.map(async arg => await arg.jsonValue()));
		// 	if (logValues.length) {
		// 		console.log(...logValues);
		// 	}
		// });

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

		let result;
		switch (flag) {
			case 'all':
				result = await getResorts(page);
				break;
			case 'regions':
				result = await getRegions(page);
				break;
			case 'resortsInRegion':
				result = await getResorts(page, req.query.region);
				const firstKey = Object.keys(result)[0];
				result = result[firstKey];
				break;
			default:
				result = await getResorts(page);
				break;
		}

		return result;
	} catch (err) {
		console.log(err, 'resorts');
	} finally {
		await browser?.close();
	}
};

module.exports = {
	resorts,
};
