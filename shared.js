const clickUnitButton = async (page, units) => {
	try {
		// Open unit btns
		await page.click('.forecast-table__header-container--units .switch-units');

		await page.waitForSelector('.switch-units-selector');

		//Click corresponding units button
		await page.$$eval(
			'.switch-units-selector .radio-button__input',
			(btns, units) => {
				let selectedBtn;
				btns.forEach(btn => {
					if (btn.value === units) {
						selectedBtn = btn;
					}
				});
				selectedBtn.click();
				return;
			},
			units
		);

		// Wait for units on page to change after clicking btn
		await page.waitForFunction(
			units =>
				document.querySelector('.live-snow__table .windu').innerText == (units == 'Metric' ? 'km/h' : 'mph'),
			{},
			units
		);
	} catch (err) {
		console.log(err, 'clickUnitButton');
	}
};

const getBasicInfo = async (page, url, units) => {
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

module.exports = {
	clickUnitButton,
	getBasicInfo,
};
