const clickUnitButton = async (page, units) => {
    try {
        //Click corresponding units button
        await page.$$eval('.forecast-table__headers .unit-button', (btns, units) => {
            let selectedBtn;
            btns.forEach(btn => {
                if (btn.dataset.units == units) {
                    selectedBtn = btn;
                }
            })
            selectedBtn.click();
            return;
        }, units)


        //Wait for units on page to change after clicking btn
        await page.waitForFunction((units) => 
            document.querySelector('.forecast-table-wind__header-container > .windu').innerText == (units == 'Metric' ? 'km/h' : 'mph'),
            {},
            units
        );
    } catch(err) {
        console.log(err, 'clickUnitButton')
    }
}

const getBasicInfo = async (page, url, units) => {
    try {
        const unit = units === 'Metric' ? 'm' : 'ft';
        const basicInfo = await page.evaluate((unit, url) => {
            const basicInfoObject = {};
            const region = document.querySelectorAll('.location-breadcrumbs__item > .location-breadcrumbs__link');
            const name = document.querySelectorAll('.location-breadcrumbs__item > .location-breadcrumbs__name');
            basicInfoObject.region = region[1].innerText;
            basicInfoObject.name = name[0].innerText;
            basicInfoObject.url = url;
            basicInfoObject.topLiftElevation = document.querySelector('.sidebar .elevation-control__link--top > .height').innerText + unit;
            basicInfoObject.midLiftElevation = document.querySelector('.sidebar .elevation-control__link--mid > .height').innerText + unit;
            basicInfoObject.botLiftElevation = document.querySelector('.sidebar .elevation-control__link--bot > .height').innerText + unit;
            basicInfoObject.lat = document.querySelector('.latitude').getAttribute('title');
            basicInfoObject.lon = document.querySelector('.longitude').getAttribute('title');
            return basicInfoObject;
        }, unit, url)
        return basicInfo;
    } catch(err) {
        console.log(err, 'getBasicInfo')
    }
}

const getForecast = async (page, units) => {
    try {
        let forecastArray = [];

        //Get days
        const daysArray = await page.$$eval('.forecast-table-days__name', (days) => {
            const daysTemp = [];
            days.forEach((day, i) => {
                if (i >= 1 && i <= 5) {
                    daysTemp.push(day.innerText.toLowerCase());
                }
            })
            return daysTemp;
        })

        //Get summaries
        const summariesArray = await page.$$eval('.forecast-table-phrases__value', (summaries) => {
            const summaryTemp = [];
            let summaryChunk = {};
            let startSelection = false;
            let count = 0;
            summaries.forEach((summary, i) => {
                if (i <= 17) {
                    if (startSelection && summary.parentElement.parentElement.classList.contains('day-end')) {
                        summaryChunk.night = summary.innerText;
                        if (summaryChunk.night.includes('shwrs')) {
                            summaryChunk.night = summaryChunk.night.replace('shwrs', 'showers');
                        }
                        summaryTemp.push(summaryChunk);
                        summaryChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        summaryChunk.am = summary.innerText;
                        if (summaryChunk.am.includes('shwrs')) {
                            summaryChunk.am = summaryChunk.am.replace('shwrs', 'showers');
                        }
                        count++;
                    } else if (startSelection && count === 1) {
                        summaryChunk.pm = summary.innerText;
                        if (summaryChunk.pm.includes('shwrs')) {
                            summaryChunk.pm = summaryChunk.pm.replace('shwrs', 'showers');
                        }
                        count++;
                    } else if (!startSelection && summary.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return summaryTemp;
        })

        //Get wind magnitude
        const windMagArray = await page.$$eval('.forecast-table-wind .wind-icon__val', (windMags, units) => {
            const unit = (units == 'Metric' ? 'km/h' : 'mph');
            const windMagTemp = [];
            let windMagChunk = {};
            let startSelection = false;
            let count = 0;
            windMags.forEach((windMag, i) => {
                if (i <= 17) {
                    if (startSelection && windMag.parentElement.parentElement.parentElement.parentElement.classList.contains('day-end')) {
                        windMagChunk.night = windMag.textContent + unit;
                        windMagTemp.push(windMagChunk);
                        windMagChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        windMagChunk.am = windMag.textContent + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        windMagChunk.pm = windMag.textContent + unit;
                        count++;
                    } else if (!startSelection && windMag.parentElement.parentElement.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return windMagTemp;
        }, units)

        //Get wind direction
        const windDirArray = await page.$$eval('.forecast-table-wind .wind-icon__tooltip', (windDirs) => {
            const windDirTemp = [];
            let windDirChunk = {};
            let startSelection = false;
            let count = 0;
            windDirs.forEach((windDir, i) => {
                if (i <= 17) {
                    if (startSelection && windDir.parentElement.parentElement.parentElement.classList.contains('day-end')) {
                        windDirChunk.night = windDir.innerText;
                        windDirTemp.push(windDirChunk);
                        windDirChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        windDirChunk.am = windDir.innerText;
                        count++;
                    } else if (startSelection && count === 1) {
                        windDirChunk.pm = windDir.innerText;
                        count++;
                    } else if (!startSelection && windDir.parentElement.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return windDirTemp;
        })

        //Get snow forecast
        const snowArray = await page.$$eval('.forecast-table-snow__cell > .snow-amount', (snowForecasts, units) => {
            const unit = (units == 'Metric' ? 'cm' : 'in');
            const snowForecastTemp = [];
            let snowForecastChunk = {};
            let startSelection = false;
            let count = 0;
            snowForecasts.forEach((snowForecast, i) => {
                const snowForecastText = snowForecast.querySelector('.snow')?.innerText;
                if (i <= 17) {
                    if (startSelection && snowForecast.parentElement.classList.contains('day-end')) {
                        snowForecastChunk.night = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
                        snowForecastTemp.push(snowForecastChunk);
                        snowForecastChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        snowForecastChunk.am = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        snowForecastChunk.pm = parseFloat(snowForecastText) ? snowForecastText + unit : '0' + unit;
                        count++;
                    } else if (!startSelection && snowForecast.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return snowForecastTemp;
        }, units)

        //Get rain forecast
        const rainArray = await page.$$eval('.forecast-table-rain__container > .rain', (rainForecasts, units) => {
            const unit = (units == 'Metric' ? 'mm' : 'in');
            const rainForecastTemp = [];
            let rainForecastChunk = {};
            let startSelection = false;
            let count = 0;
            rainForecasts.forEach((rainForecast, i) => {
                if (i <= 17) {
                    if (startSelection && rainForecast.parentElement.parentElement.classList.contains('day-end')) {
                        rainForecastChunk.night = rainForecast.classList.contains('has-value') ? rainForecast.innerText + unit : '0' + unit;
                        rainForecastTemp.push(rainForecastChunk);
                        rainForecastChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        rainForecastChunk.am = rainForecast.classList.contains('has-value') ? rainForecast.innerText + unit : '0' + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        rainForecastChunk.pm = rainForecast.classList.contains('has-value') ? rainForecast.innerText + unit : '0' + unit;
                        count++;
                    } else if (!startSelection && rainForecast.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return rainForecastTemp;
        }, units)

        //Get max temp forecast
        const maxTempArray = await page.$$eval('[data-row="temperature-max"] .temp', (maxTs, units) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const maxTtemp = [];
            let maxTchunk = {};
            let startSelection = false;
            let count = 0;
            maxTs.forEach((maxT, i) => {
                if (i <= 17) {
                    if (startSelection && maxT.parentElement.parentElement.classList.contains('day-end')) {
                        maxTchunk.night = maxT.innerText + unit;
                        maxTtemp.push(maxTchunk);
                        maxTchunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        maxTchunk.am = maxT.innerText + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        maxTchunk.pm = maxT.innerText + unit;
                        count++;
                    } else if (!startSelection && maxT.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return maxTtemp;
        }, units)

        //Get min temp forecast
        const minTempArray = await page.$$eval('[data-row="temperature-min"] .temp', (minTs, units) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const minTtemp = [];
            let minTchunk = {};
            let startSelection = false;
            let count = 0;
            minTs.forEach((minT, i) => {
                if (i <= 17) {
                    if (startSelection && minT.parentElement.parentElement.classList.contains('day-end')) {
                        minTchunk.night = minT.innerText + unit;
                        minTtemp.push(minTchunk);
                        minTchunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        minTchunk.am = minT.innerText + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        minTchunk.pm = minT.innerText + unit;
                        count++;
                    } else if (!startSelection && minT.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return minTtemp;
        }, units)

        //Get wind chill forecast
        const windChillArray = await page.$$eval('[data-row="temperature-chill"] .temp', (chills, units) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const chillTemp = [];
            let chillChunk = {};
            let startSelection = false;
            let count = 0;
            chills.forEach((chill, i) => {
                if (i <= 17) {
                    if (startSelection && chill.parentElement.parentElement.classList.contains('day-end')) {
                        chillChunk.night = chill.innerText + unit;
                        chillTemp.push(chillChunk);
                        chillChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        chillChunk.am = chill.innerText + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        chillChunk.pm = chill.innerText + unit;
                        count++;
                    } else if (!startSelection && chill.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return chillTemp;
        }, units)

        //Get humidity forecast
        const humidityArray = await page.$$eval('.forecast-table-humidity__value', (humidityCols) => {
            const humidityTemp = [];
            let humidityChunk = {};
            let startSelection = false;
            let count = 0;
            humidityCols.forEach((humidity, i) => {
                if (i <= 17) {
                    if (startSelection && humidity.parentElement.parentElement.classList.contains('day-end')) {
                        humidityChunk.night = humidity.innerText + '%';
                        humidityTemp.push(humidityChunk);
                        humidityChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        humidityChunk.am = humidity.innerText + '%';
                        count++;
                    } else if (startSelection && count === 1) {
                        humidityChunk.pm = humidity.innerText + '%';
                        count++;
                    } else if (!startSelection && humidity.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return humidityTemp;
        })

        //Get freezing level forecast
        const freezeLevelArray = await page.$$eval('[data-row="freezing-level"] .heightfl', (freezeLevels, units) => {
            const unit = (units == 'Metric' ? 'm' : 'ft');
            const freezeLevelsTemp = [];
            let freezeLevelsChunk = {};
            let startSelection = false;
            let count = 0;
            freezeLevels.forEach((freezeLevel, i) => {
                if (i <= 17) {
                    if (startSelection && freezeLevel.parentElement.parentElement.classList.contains('day-end')) {
                        freezeLevelsChunk.night = freezeLevel.innerText + unit;
                        freezeLevelsTemp.push(freezeLevelsChunk);
                        freezeLevelsChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        freezeLevelsChunk.am = freezeLevel.innerText + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        freezeLevelsChunk.pm = freezeLevel.innerText + unit;
                        count++;
                    } else if (!startSelection && freezeLevel.parentElement.parentElement.classList.contains('day-end')) {
                        startSelection = true;
                    } 
                }
            })
            return freezeLevelsTemp;
        }, units)

        //Get summaries
        const forecastSummaries = await page.$$eval('.h-container .phrase', (summaries) => {
            const forecastSummariesTemp = {};
            summaries.forEach((summary, i) => {
                if (i === 0) {
                    forecastSummariesTemp.summary3Day = summary.innerText;
                } else if (i === 1) {
                    forecastSummariesTemp.summaryDays4To6 = summary.innerText;
                }
            })
            return forecastSummariesTemp;
        })

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
                freezeLevel: freezeLevelArray[i]
            })
        })

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
                night: forecastNIGHT
            }
        })

        return {
            forecast5Day: organizedArray,
            summary3Day: forecastSummaries.summary3Day,
            summaryDays4To6: forecastSummaries.summaryDays4To6
        };
    } catch(err) {
        console.log(err, 'getForecast')
    }
}

const handleUnitChange = async (page, url, elevation, units) => {
    try {
        //Click elevation buttons and get forecast for each elevation
        let weeklyForecast = {};
        let basicInfo = {};

        const handleElevationChange = async (newUrl) => {
            await page.goto(newUrl, { waitUntil: 'domcontentloaded' });
            await clickUnitButton(page, units);
            return await getForecast(page, units);
        }

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

            return {
                ...weeklyForecast,
                basicInfo
            }
        } else {
            const forecast = await handleElevationChange(url);;
            basicInfo = await getBasicInfo(page, url, units);

            return {
                ...forecast,
                basicInfo
            }
        }

    } catch(err) {
        console.log(err, 'handleUnitChange')
    }
}

const forecast = async (req, res, p, scrapedUrl) => {
    try {
        let url;
        if (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') {
            url = `${scrapedUrl}/${req?.query?.el}`;
        } else {
            url = {
                top: `${scrapedUrl}/top`,
                mid: `${scrapedUrl}/mid`,
                bot: `${scrapedUrl}/bot`
            }
        }

        // url = (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') ? `${url}/${req?.query?.el}` : `${url}/top`;
        const units = req?.query?.units;
        const elevation = (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') ? req?.query?.el : null;

        var browser = await p.launch({
            headless: true, 
            executablePath: "google-chrome", 
            // executablePath: "./chrome-win/chrome.exe", 
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setDefaultTimeout(60000);
        await page.setRequestInterception(true);

        //Skip loading of imgs/stylesheets/media
        page.on('request', request => {
            if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet'  || request.resourceType() === 'media'  || request.resourceType() === 'font')
                request.abort();
            else
                request.continue();
        });

        // page.on('console', async (msg) => {
        //     const msgArgs = msg.args();
        //     const logValues = await Promise.all(msgArgs.map(async arg => await arg.jsonValue()));
        //     if (logValues.length) {
        //         console.log(...logValues);
        //     }
        // })
        
        // await page.goto(url, { waitUntil: 'domcontentloaded' });

        let resultMetric;
        let resultImperial;
        
        if (units === 'm' || units === undefined) {
            resultMetric = await handleUnitChange(page, url, elevation, 'Metric')
        }
        if (units === 'i' || units === undefined) {
            resultImperial = await handleUnitChange(page, url, elevation, 'Imperial')
        }
        
        const result = {
            metric: resultMetric,
            imperial: resultImperial
        }
        
        const u = (units === 'm' ? 'metric' : 'imperial')
        return (units ? result[u] : result);
    } catch (err) {
        console.log(err, 'forecast');
    } finally {
        await browser?.close();
    }
}

module.exports = {
    forecast
}