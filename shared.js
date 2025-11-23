export const clickUnitButton = async (page, units) => {
	try {
		// Open unit btns
		await page.click('.forecast-table__header-container--units .switch-units');

		// Wait for unit selector
		await page.waitForSelector('.switch-units-selector');

		switch (units) {
			case 'Metric':
				await page.click('.switch-units-selector__control .radio-button__input[value="Metric"]');
				break;
			case 'Imperial':
				await page.click('.switch-units-selector__control .radio-button__input[value="Imperial"]');
				break;
		}

		// const test1 = await page.$eval(
		// 	'.switch-units-selector__control .radio-button__input[value="Metric"]',
		// 	el => el.checked
		// );
		// const test2 = await page.$eval(
		// 	'.switch-units-selector__control .radio-button__input[value="Imperial"]',
		// 	el => el.checked
		// );

		// console.log(test1, test2);

		// // Wait for units on page to change after clicking btn
		await page.waitForFunction(
			units => {
				const unitTestEl = document.querySelector('.forecast-table__row[data-row="snow"] .snowu');
				return unitTestEl.innerText === (units === 'Metric' ? 'cm' : 'in');
			},
			{},
			units
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
