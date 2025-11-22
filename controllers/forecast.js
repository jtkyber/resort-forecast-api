const { clickUnitButton, getBasicInfo } = require('../shared');

const getForecast = async (page, units) => {
	try {
		let forecastArray = [];

		//Get days
		const daysArray = await page.$$eval('.forecast-table-days__name', days => {
			const daysTemp = [];
			days.forEach((day, i) => {
				if (i >= 1 && i <= 5) {
					daysTemp.push(day.innerText.toLowerCase());
				}
			});
			return daysTemp;
		});

		//Get summaries
		const summariesArray = await page.$$eval('.forecast-table__cell .forecast-table__phrase', summaries => {
			const summaryTemp = [];
			let summaryChunk = {};
			let dayCount = 0;
			let count = 0;
			summaries.forEach((summary, i) => {
				const isDayEnd = summary.parentElement.classList.contains('forecast-table__container--border');
				if (dayCount > 0 && dayCount < 6) {
					switch (count) {
						case 0:
							summaryChunk.am = summary.innerText;
							if (summaryChunk.am.includes('shwrs')) {
								summaryChunk.am = summaryChunk.am.replace('shwrs', 'showers');
							}
							count = 1;
							break;
						case 1:
							summaryChunk.pm = summary.innerText;
							if (summaryChunk.pm.includes('shwrs')) {
								summaryChunk.pm = summaryChunk.pm.replace('shwrs', 'showers');
							}
							count = 2;
							break;
						case 2:
							summaryChunk.night = summary.innerText;
							if (summaryChunk.night.includes('shwrs')) {
								summaryChunk.night = summaryChunk.night.replace('shwrs', 'showers');
							}
							summaryTemp.push(summaryChunk);
							summaryChunk = {};
							count = 0;
							break;
					}
				}

				if (isDayEnd) {
					dayCount++;
				}
			});

			return summaryTemp;
		});

		//Get wind magnitude
		const windMagArray = await page.$$eval(
			'.forecast-table__container--wind',
			(windMags, units) => {
				const unit = units == 'Metric' ? 'km/h' : 'mph';
				const windMagTemp = [];
				let windMagChunk = {};
				let dayCount = 0;
				let count = 0;
				windMags.forEach((windMag, i) => {
					if (dayCount > 0 && dayCount < 6) {
						const windText = windMag.querySelector('.wind-icon__val').textContent;
						switch (count) {
							case 0:
								windMagChunk.am = windText + unit;
								count = 1;
								break;
							case 1:
								windMagChunk.pm = windText + unit;
								count = 2;
								break;
							case 2:
								windMagChunk.night = windText + unit;
								windMagTemp.push(windMagChunk);
								windMagChunk = {};
								count = 0;
								break;
						}
					}

					if (windMag.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});

				return windMagTemp;
			},
			units
		);

		//Get wind direction
		const windDirArray = await page.$$eval('.forecast-table__container--wind', windDirs => {
			const windDirTemp = [];
			let windDirChunk = {};
			let dayCount = 0;
			let count = 0;
			windDirs.forEach((windDir, i) => {
				if (dayCount > 0 && dayCount < 6) {
					const windText = windDir.querySelector('.wind-icon__tooltip').innerText;
					switch (count) {
						case 0:
							windDirChunk.am = windText;
							count = 1;
							break;
						case 1:
							windDirChunk.pm = windText;
							count = 2;
							break;
						case 2:
							windDirChunk.night = windText;
							windDirTemp.push(windDirChunk);
							windDirChunk = {};
							count = 0;
							break;
					}
				}

				if (windDir.classList.contains('forecast-table__container--border')) {
					dayCount++;
				}
			});

			return windDirTemp;
		});

		//Get snow forecast
		const snowArray = await page.$$eval(
			'.forecast-table__container--snow',
			(snowForecasts, units) => {
				const unit = units == 'Metric' ? 'cm' : 'in';
				const snowForecastTemp = [];
				let snowForecastChunk = {};
				let dayCount = 0;
				let count = 0;
				snowForecasts.forEach((snowForecast, i) => {
					const snowForecastText = snowForecast.querySelector('.snow-amount__value')?.innerText;
					if (dayCount > 0 && dayCount < 6) {
						switch (count) {
							case 0:
								snowForecastChunk.am = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
								count = 1;
								break;
							case 1:
								snowForecastChunk.pm = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
								count = 2;
								break;
							case 2:
								snowForecastChunk.night = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
								snowForecastTemp.push(snowForecastChunk);
								snowForecastChunk = {};
								count = 0;
								break;
						}
					}

					if (snowForecast.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});
				return snowForecastTemp;
			},
			units
		);

		//Get rain forecast
		const rainArray = await page.$$eval(
			'.forecast-table__container--rain.rain-amount',
			(rainForecasts, units) => {
				const unit = units == 'Metric' ? 'mm' : 'in';
				const rainForecastTemp = [];
				let rainForecastChunk = {};
				let dayCount = 0;
				let count = 0;
				rainForecasts.forEach((rainForecast, i) => {
					const rainForecastText = rainForecast.querySelector('.rain-amount__value')?.innerText;
					if (dayCount > 0 && dayCount < 6) {
						switch (count) {
							case 0:
								rainForecastChunk.am = rainForecastText ? rainForecastText + unit : '0' + unit;
								count = 1;
								break;
							case 1:
								rainForecastChunk.pm = rainForecastText ? rainForecastText + unit : '0' + unit;
								count = 2;
								break;
							case 2:
								rainForecastChunk.night = rainForecastText ? rainForecastText + unit : '0' + unit;
								rainForecastTemp.push(rainForecastChunk);
								rainForecastChunk = {};
								count = 0;
								break;
						}
					}

					if (rainForecast.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});
				return rainForecastTemp;
			},
			units
		);

		//Get max temp forecast
		const maxTempArray = await page.$$eval(
			'[data-row="temperature-max"] .forecast-table__container',
			(maxTs, units) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const maxTtemp = [];
				let maxTchunk = {};
				let dayCount = 0;
				let count = 0;
				maxTs.forEach((maxT, i) => {
					if (dayCount > 0 && dayCount < 6) {
						switch (count) {
							case 0:
								maxTchunk.am = maxT.innerText + unit;
								count = 1;
								break;
							case 1:
								maxTchunk.pm = maxT.innerText + unit;
								count = 2;
								break;
							case 2:
								maxTchunk.night = maxT.innerText + unit;
								maxTtemp.push(maxTchunk);
								maxTchunk = {};
								count = 0;
								break;
						}
					}

					if (maxT.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});
				return maxTtemp;
			},
			units
		);

		//Get min temp forecast
		const minTempArray = await page.$$eval(
			'[data-row="temperature-min"] .forecast-table__container',
			(minTs, units) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const minTtemp = [];
				let minTchunk = {};
				let dayCount = 0;
				let count = 0;
				minTs.forEach((minT, i) => {
					if (dayCount > 0 && dayCount < 6) {
						switch (count) {
							case 0:
								minTchunk.am = minT.innerText + unit;
								count = 1;
								break;
							case 1:
								minTchunk.pm = minT.innerText + unit;
								count = 2;
								break;
							case 2:
								minTchunk.night = minT.innerText + unit;
								minTtemp.push(minTchunk);
								minTchunk = {};
								count = 0;
								break;
						}
					}

					if (minT.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});
				return minTtemp;
			},
			units
		);

		//Get wind chill forecast
		const windChillArray = await page.$$eval(
			'[data-row="temperature-chill"] .forecast-table__container',
			(chills, units) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const chillTemp = [];
				let chillChunk = {};
				let dayCount = 0;
				let count = 0;
				chills.forEach((chill, i) => {
					if (dayCount > 0 && dayCount < 6) {
						switch (count) {
							case 0:
								chillChunk.am = chill.innerText + unit;
								count = 1;
								break;
							case 1:
								chillChunk.pm = chill.innerText + unit;
								count = 2;
								break;
							case 2:
								chillChunk.night = chill.innerText + unit;
								chillTemp.push(chillChunk);
								chillChunk = {};
								count = 0;
								break;
						}
					}

					if (chill.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});
				return chillTemp;
			},
			units
		);

		//Get humidity forecast
		const humidityArray = await page.$$eval('.forecast-table__container--green', humidityCols => {
			const humidityTemp = [];
			let humidityChunk = {};
			let dayCount = 0;
			let count = 0;
			humidityCols.forEach((humidity, i) => {
				if (dayCount > 0 && dayCount < 6) {
					switch (count) {
						case 0:
							humidityChunk.am = humidity.innerText + '%';
							count = 1;
							break;
						case 1:
							humidityChunk.pm = humidity.innerText + '%';
							count = 2;
							break;
						case 2:
							humidityChunk.night = humidity.innerText + '%';
							humidityTemp.push(humidityChunk);
							humidityChunk = {};
							count = 0;
							break;
					}
				}

				if (humidity.classList.contains('forecast-table__container--border')) {
					dayCount++;
				}
			});
			return humidityTemp;
		});

		//Get freezing level forecast
		const freezeLevelArray = await page.$$eval(
			'[data-row="freezing-level"] .forecast-table__container',
			(freezeLevels, units) => {
				const unit = units == 'Metric' ? 'm' : 'ft';
				const freezeLevelsTemp = [];
				let freezeLevelsChunk = {};
				let dayCount = 0;
				let count = 0;
				freezeLevels.forEach((freezeLevel, i) => {
					if (dayCount > 0 && dayCount < 6) {
						const freezeText = freezeLevel.querySelector('.level-value').innerText;
						switch (count) {
							case 0:
								freezeLevelsChunk.am = freezeText + unit;
								count = 1;
								break;
							case 1:
								freezeLevelsChunk.pm = freezeText + unit;
								count = 2;
								break;
							case 2:
								freezeLevelsChunk.night = freezeText + unit;
								freezeLevelsTemp.push(freezeLevelsChunk);
								freezeLevelsChunk = {};
								count = 0;
								break;
						}
					}

					if (freezeLevel.classList.contains('forecast-table__container--border')) {
						dayCount++;
					}
				});

				return freezeLevelsTemp;
			},
			units
		);

		//Get summaries
		const forecastSummaries = await page.$$eval('.h-container .phrase', summaries => {
			const forecastSummariesTemp = {};
			summaries.forEach((summary, i) => {
				if (i === 0) {
					forecastSummariesTemp.summary3Day = summary.innerText;
				} else if (i === 1) {
					forecastSummariesTemp.summaryDays4To6 = summary.innerText;
				}
			});
			return forecastSummariesTemp;
		});

		daysArray.forEach((day, i) => {
			forecastArray.push({
				day: day,
				summary: summariesArray[i],
				windSpeed: windMagArray[i],
				windDirection: windDirArray[i],
				snow: snowArray[i],
				rain: rainArray[i],
				maxTemp: maxTempArray[i],
				minTemp: minTempArray[i],
				windChill: windChillArray[i],
				humidity: humidityArray[i],
				freezeLevel: freezeLevelArray[i],
			});
		});

		//Reorganize array by time of day
		const organizedArray = forecastArray.map(day => {
			const forecastAM = {};
			const forecastPM = {};
			const forecastNIGHT = {};
			for (let item in day) {
				if (item !== 'day') {
					forecastAM[item] = day[item].am;
					forecastPM[item] = day[item].pm;
					forecastNIGHT[item] = day[item].night;
				}
			}

			return {
				dayOfWeek: day.day,
				am: forecastAM,
				pm: forecastPM,
				night: forecastNIGHT,
			};
		});

		return {
			forecast5Day: organizedArray,
			summary3Day: forecastSummaries.summary3Day,
			summaryDays4To6: forecastSummaries.summaryDays4To6,
		};
	} catch (err) {
		console.log(err, 'getForecast');
	}
};

const handleUnitChange = async (page, url, elevation, units) => {
	try {
		//Click elevation buttons and get forecast for each elevation
		let weeklyForecast = {};
		let basicInfo = {};

		const handleElevationChange = async newUrl => {
			await page.goto(newUrl, { waitUntil: 'domcontentloaded' });
			await clickUnitButton(page, units);
			return await getForecast(page, units);
		};

		if (!elevation && Object.keys(url).length === 3) {
			// for (let i = 0; i <= 2; i++) {
			//     await page.evaluate((i) => {
			//         const elevationBtnTop = document.querySelectorAll('#leftNav .elevation-control__link');
			//         elevationBtnTop[i].click();
			//     }, i)

			//     await page.waitForNavigation();

			//     if (i == 0) {
			//         await clickUnitButton(page, units);
			//         weeklyForecast.topLift = await getForecast(page, units);
			//     } else if (i == 1) {
			//         await clickUnitButton(page, units);
			//         weeklyForecast.midLift = await getForecast(page, units);
			//     } else if (i == 2) {
			//         await clickUnitButton(page, units);
			//         weeklyForecast.botLift = await getForecast(page, units);
			//     }
			// }

			weeklyForecast.topLift = await handleElevationChange(url.top);
			weeklyForecast.midLift = await handleElevationChange(url.mid);
			weeklyForecast.botLift = await handleElevationChange(url.bot);
			basicInfo = await getBasicInfo(page, url.top, units);
			// console.log(basicInfo);

			return {
				...weeklyForecast,
				basicInfo,
			};
		} else {
			const forecast = await handleElevationChange(url);
			basicInfo = await getBasicInfo(page, url, units);

			return {
				...forecast,
				basicInfo,
			};
		}
	} catch (err) {
		console.log(err, 'handleUnitChange');
	}
};

const forecast = async (req, res, p, scrapedUrl) => {
	try {
		let url;
		if (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') {
			url = `${scrapedUrl}/${req?.query?.el}`;
		} else {
			url = {
				top: `${scrapedUrl}/top`,
				mid: `${scrapedUrl}/mid`,
				bot: `${scrapedUrl}/bot`,
			};
		}

		// url = (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') ? `${url}/${req?.query?.el}` : `${url}/top`;
		const units = req?.query?.units;
		const elevation =
			req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot'
				? req?.query?.el
				: null;

		var browser = await p.launch({
			headless: 'new',
			executablePath: 'google-chrome',
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

		// page.on('console', async msg => {
		// 	const msgArgs = msg.args();
		// 	const logValues = await Promise.all(msgArgs.map(async arg => await arg.jsonValue()));
		// 	if (logValues.length) {
		// 		console.log(...logValues);
		// 	}
		// });

		// await page.goto(url, { waitUntil: 'domcontentloaded' });

		let resultMetric;
		let resultImperial;

		if (units === 'm' || units === undefined) {
			resultMetric = await handleUnitChange(page, url, elevation, 'Metric');
		}
		if (units === 'i' || units === undefined) {
			resultImperial = await handleUnitChange(page, url, elevation, 'Imperial');
		}

		const result = {
			metric: resultMetric,
			imperial: resultImperial,
		};

		const u = units === 'm' ? 'metric' : 'imperial';
		return units ? result[u] : result;
	} catch (err) {
		console.log(err, 'forecast');
	} finally {
		await browser?.close();
	}
};

module.exports = {
	forecast,
};
