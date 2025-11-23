export const clickUnitButton = async (page, units) => {
	try {
		const radioSelector = `.switch-units-selector__control .radio-button__input[value="${
			units === 'Metric' ? 'Metric' : 'Imperial'
		}"]`;

		// Open unit btns
		await page.click('.forecast-table__header-container--units .switch-units');

		// Wait for unit selector
		await page.waitForSelector(radioSelector);

		// Click respective units button
		await page.click(radioSelector);

		// Wait for radio to be checked
		await page.waitForFunction(
			sel => {
				const el = document.querySelector(sel);
				return !!el && el?.checked === true;
			},
			{ polling: 'mutation' },
			radioSelector
		);

		await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

		// Wait for units on page to change after clicking btn
		const unitSelector = '.live-snow__table .windu';
		const expectedUnitText = units === 'Metric' ? 'km/h' : 'mph';
		await page.waitForFunction(
			(unitSelector, expectedUnitText) => {
				const unitTestEl = document.querySelector(unitSelector);
				return unitTestEl.innerText === expectedUnitText;
			},
			{ polling: 'mutation' },
			unitSelector,
			expectedUnitText
		);
	} catch (err) {
		console.log(err, 'clickUnitButton');
	}
};

export const getBasicInfo = async (page, url, units) => {
	try {
		const unit = units === 'Metric' ? 'm' : 'ft';
		const basicInfo = await page.evaluate(
			(unit, url) => {
				const basicInfoObject = {};
				const region = document.querySelectorAll('.location-breadcrumbs__item > .location-breadcrumbs__link');
				const name = document.querySelectorAll('.location-breadcrumbs__item > .location-breadcrumbs__name');
				basicInfoObject.region = region[1].innerText;
				basicInfoObject.name = name[0].innerText;
				basicInfoObject.url = url;
				basicInfoObject.topLiftElevation =
					document.querySelector('.sidebar .elevation-control__link--top > .height').innerText + unit;
				basicInfoObject.midLiftElevation =
					document.querySelector('.sidebar .elevation-control__link--mid > .height').innerText + unit;
				basicInfoObject.botLiftElevation =
					document.querySelector('.sidebar .elevation-control__link--bot > .height').innerText + unit;
				basicInfoObject.lat = document.querySelector('.latitude').getAttribute('title');
				basicInfoObject.lon = document.querySelector('.longitude').getAttribute('title');
				return basicInfoObject;
			},
			unit,
			url
		);
		return basicInfo;
	} catch (err) {
		console.log(err, 'getBasicInfo');
	}
};
