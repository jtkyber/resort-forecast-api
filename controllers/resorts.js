const getResorts = async (page, region = false) => {
	try {
		const resortObject = {};
		// Get all region values
		const regions = await getRegions(page);

		for (let i = 0; i < regions.values.length; i++) {
			const regionValue = regions.values[i];
			const regionName = regions.names[i];

			if (region && region !== regionName) continue;

			page.select('.location-navigation #feature', regionValue);

			await page.waitForFunction(
				() => {
					const select = document.querySelector('.location-navigation #resort');
					return select && select.disabled;
				},
				{ timeout: 5000 }
			);
			await page.waitForFunction(
				() => {
					const select = document.querySelector('.location-navigation #resort');
					return select && !select.disabled;
				},
				{ timeout: 5000 }
			);

			const resortNames = await page.$$eval('.location-navigation #resort option', options => {
				return options.map(option => option.value).filter(o => !o.disabled);
			});

			resortObject[regionName] = resortNames;
		}

		return resortObject;
	} catch (err) {
		console.log(err, 'clickUnitButton');
	}
};

const getRegions = async page => {
	const regions = await page.$$eval('.location-navigation #feature option', options => {
		let regionsTemp = { values: [], names: [] };
		for (let option of options) {
			if (!isNaN(option.value)) {
				regionsTemp.names.push(option.innerText);
				regionsTemp.values.push(option.value);
			}
		}
		return regionsTemp;
	});
	return regions;
};

const resorts = async (req, res, p, flag) => {
	try {
		const url = 'https://www.snow-forecast.com/countries';
		var browser = await p.launch({
			headless: 'new',
			executablePath: 'google-chrome',
			// executablePath: './chrome-win/chrome.exe',
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

		let result;
		switch (flag) {
			case 'all':
				result = await getResorts(page);
				break;
			case 'regions':
				result = (await getRegions(page)).names;
				break;
			case 'resortsInRegion':
				result = await getResorts(page, req.query.region);
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
