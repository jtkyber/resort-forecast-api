import { clickUnitButton, getBasicInfo } from '../shared.js';

//Click buttons to expand hourly
const expandHourly = async (page, c) => {
	try {
		//1st Buttons
		console.log('expand 1');
		const isBtn1Expand1 = await page.$$eval('.forecast-table-days__button', btns => {
			for (let i = 0; i < btns.length; i++) {
				if (!btns[i].classList.contains('is-collapse')) {
					btns[i].click();
					return true;
				}
			}
			return false;
		});

		if (isBtn1Expand1) {
			console.log('b1 expanded');
			await page.waitForSelector('.forecast-table-days__cell.is-expanded-t');
		}

		console.log('expand 2');
		const isBtn1Expand2 = await page.$$eval('.forecast-table-days__button', btns => {
			for (let i = 0; i < btns.length; i++) {
				if (!btns[i].classList.contains('is-collapse')) {
					btns[i].click();
					return true;
				}
			}
			return false;
		});

		if (isBtn1Expand2) {
			console.log('b2 expanded');
			await page.waitForSelector('.forecast-table-days__cell.is-expanded-h');
			console.log('hourly loaded');
		}

		//2nd Buttons
		if (!c) {
			console.log('getting next day hrs');
			const isBtn2Expand1 = await page.$$eval('.forecast-table-days__button', btns => {
				if (!btns[1].classList.contains('js-sign-up-no-free')) {
					btns[1].click();
					return true;
				}
				return false;
			});

			if (isBtn2Expand1) {
				await page.waitForSelector('.forecast-table-days__button.is-on-right');
			}

			const isBtn2Expand2 = await page.$$eval('.forecast-table-days__button.is-on-right', btns => {
				if (btns[0]) {
					btns[0].click();
					return true;
				}
				return false;
			});

			if (isBtn2Expand2) {
				await page.waitForFunction(
					() => document.querySelectorAll('.forecast-table-days__cell.is-expanded-h').length >= 2
				);
			}
		}
	} catch (err) {
		console.log(err, 'expandHourly');
	}
};

const getHourly = async (page, units, c) => {
	try {
		console.log('getHourly');
		await expandHourly(page, c);
		//Get times
		const timesArray = await page.$$eval(
			'[data-row="time"] .is-expanded-h > .forecast-table__time',
			(times, c) => {
				const timeTemp = [];
				let count = c ? 1 : 0;
				times.forEach((time, i) => {
					if (count < 2) timeTemp.push(time.innerText.replace(' ', ''));
					if (time?.classList.contains('forecast-table__container--border') && count < 2) count += 1;
				});
				return timeTemp;
			},
			c
		);

		//Get summaries
		const summaryArray = await page.$$eval(
			'[data-row="phrases"] .is-expanded-h .forecast-table__phrase',
			(summaries, c) => {
				const summaryTemp = [];
				let count = c ? 1 : 0;
				summaries.forEach((summary, i) => {
					if (count < 2) {
						let sumCorrected = summary.innerText;
						if (sumCorrected.includes('shwrs')) {
							sumCorrected = sumCorrected.replace('shwrs', 'showers');
						}
						summaryTemp.push(sumCorrected);
					}
					if (summary?.parentElement?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return summaryTemp;
			},
			c
		);

		//Get wind speed
		const windSpeedArray = await page.$$eval(
			'[data-row="wind"] .is-expanded-h .wind-icon__val',
			(speeds, units, c) => {
				const unit = units == 'Metric' ? 'km/h' : 'mph';
				const speedTemp = [];
				let count = c ? 1 : 0;
				speeds.forEach((speed, i) => {
					if (count < 2) {
						speedTemp.push(speed.textContent + unit);
					}
					if (
						speed?.parentElement?.parentElement?.parentElement?.classList.contains(
							'forecast-table__container--border'
						) &&
						count < 2
					) {
						count += 1;
					}
				});
				return speedTemp;
			},
			units,
			c
		);

		//Get wind direction
		const windDirArray = await page.$$eval(
			'[data-row="wind"] .is-expanded-h .wind-icon__tooltip',
			(windDirs, c) => {
				const windDirTemp = [];
				let count = c ? 1 : 0;
				windDirs.forEach((windDir, i) => {
					if (count < 2) {
						windDirTemp.push(windDir.textContent);
					}
					if (
						windDir?.parentElement?.parentElement?.parentElement?.classList.contains(
							'forecast-table__container--border'
						) &&
						count < 2
					) {
						count += 1;
					}
				});
				return windDirTemp;
			},
			c
		);

		//Get snow forecast
		const snowArray = await page.$$eval(
			'[data-row="snow"] .is-expanded-h .snow-amount',
			(snowForecasts, units, c) => {
				const unit = units == 'Metric' ? 'cm' : 'in';
				const snowForecastTemp = [];
				let count = c ? 1 : 0;
				snowForecasts.forEach((snowForecast, i) => {
					if (count < 2) {
						const snowText = snowForecast.querySelector('.snow-amount__value')?.innerText;

						snowForecastTemp.push(parseFloat(snowText) ? snowText + unit : '0' + unit);
					}
					if (snowForecast?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return snowForecastTemp;
			},
			units,
			c
		);

		//Get rain forecast
		const rainArray = await page.$$eval(
			'[data-row="rain"] .is-expanded-h .rain-amount',
			(rainForecasts, units, c) => {
				const unit = units == 'Metric' ? 'mm' : 'in';
				const rainForecastTemp = [];
				let count = c ? 1 : 0;
				rainForecasts.forEach((rainForecast, i) => {
					if (count < 2) {
						const rainText = rainForecast.querySelector('.rain-amount__value')?.innerText;
						rainForecastTemp.push(parseFloat(rainText) ? rainText + unit : '0' + unit);
					}
					if (rainForecast?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return rainForecastTemp;
			},
			units,
			c
		);

		//Get max temp forecast
		const maxTempArray = await page.$$eval(
			'[data-row="temperature-max"] .is-expanded-h .forecast-table__container',
			(maxTs, units, c) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const maxTtemp = [];
				let count = c ? 1 : 0;
				maxTs.forEach((maxT, i) => {
					if (count < 2) maxTtemp.push(maxT.innerText + unit);
					if (maxT?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return maxTtemp;
			},
			units,
			c
		);

		//Get max temp forecast
		const minTempArray = await page.$$eval(
			'[data-row="temperature-min"] .is-expanded-h .forecast-table-temp__value',
			(minTs, units, maxTempArray, c) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const minTtemp = [];
				let count = c ? 1 : 0;
				if (minTs.length > 1) {
					minTs.forEach((minT, i) => {
						if (count < 2) minTtemp.push(minT.innerText + unit);
						if (minT?.classList.contains('forecast-table__container--border') && count < 2) {
							count += 1;
						}
					});
				} else {
					maxTempArray.forEach(() => {
						minTtemp.push(null);
					});
				}
				return minTtemp;
			},
			units,
			maxTempArray,
			c
		);

		//Get wind chill
		const windChillArray = await page.$$eval(
			'[data-row="temperature-chill"] .is-expanded-h .forecast-table__container',
			(chills, units, c) => {
				const unit = units == 'Metric' ? '°C' : '°F';
				const chillTemp = [];
				let count = c ? 1 : 0;
				chills.forEach((chill, i) => {
					if (count < 2) chillTemp.push(chill.innerText + unit);
					if (chill?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return chillTemp;
			},
			units,
			c
		);

		//Get humidity
		const humidityArray = await page.$$eval(
			'[data-row="humidity"] .is-expanded-h .forecast-table__container',
			(humidityCols, c) => {
				const humidityTemp = [];
				let count = c ? 1 : 0;
				humidityCols.forEach((humidityCol, i) => {
					if (count < 2) humidityTemp.push(humidityCol?.innerText ? humidityCol.innerText + '%' : null);
					if (humidityCol?.classList.contains('forecast-table__container--border') && count < 2) {
						count += 1;
					}
				});
				return humidityTemp;
			},
			c
		);

		//Get freeze level
		const freezeLevelArray = await page.$$eval(
			'[data-row="freezing-level"] .is-expanded-h .forecast-table__container',
			(freezeLevels, units, c) => {
				const unit = units == 'Metric' ? 'm' : 'ft';
				const freezeLevelTemp = [];
				let count = c ? 1 : 0;
				freezeLevels.forEach((freezeLevel, i) => {
					if (count < 2) freezeLevelTemp.push(freezeLevel?.innerText ? freezeLevel.innerText + unit : null);
					if (freezeLevel?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
						count += 1;
					}
				});
				return freezeLevelTemp;
			},
			units,
			c
		);

		const hourlyArray = [];
		timesArray.forEach((time, i) => {
			hourlyArray.push({
				time: time,
				summary: summaryArray[i],
				windSpeed: windSpeedArray[i],
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
		return hourlyArray;
	} catch (err) {
		console.log(err, 'getHourly');
	}
};

const handleUnitChange = async (page, url, elevation, units, c) => {
	try {
		let hourlyForecast = {};
		let basicInfo = {};

		const handleElevationChange = async newUrl => {
			console.log('handleUnitChange ' + newUrl);
			await page.goto(newUrl, { waitUntil: 'domcontentloaded' });
			await clickUnitButton(page, units);
			return await getHourly(page, units, c);
		};

		if (!elevation && Object.keys(url).length === 3) {
			hourlyForecast.topLift = await handleElevationChange(url.top);
			hourlyForecast.midLift = await handleElevationChange(url.mid);
			hourlyForecast.botLift = await handleElevationChange(url.bot);
			basicInfo = await getBasicInfo(page, url.top, units);
		} else {
			hourlyForecast.forecast = await handleElevationChange(url);
			basicInfo = await getBasicInfo(page, url, units);
		}

		return {
			...hourlyForecast,
			basicInfo,
		};
	} catch (err) {
		console.log(err, 'handleUnitChange');
	}
};

export const hourly = async (req, res, p, scrapedUrl) => {
	try {
		console.log('hourly');
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

		const units = req?.query?.units;
		let c = req?.query?.c === 'true' ? true : null;
		c = true;
		const elevation =
			req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot'
				? req?.query?.el
				: null;
		var browser = await p.launch({
			headless: 'new',
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();
		await page.setDefaultTimeout(90000);
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

		let resultMetric;
		let resultImperial;
		if (units === 'm' || !units) {
			resultMetric = await handleUnitChange(page, url, elevation, 'Metric', c);
		}
		if (units === 'i' || !units) {
			resultImperial = await handleUnitChange(page, url, elevation, 'Imperial', c);
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
