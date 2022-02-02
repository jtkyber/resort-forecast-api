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
            document.querySelector('.snow-depths-table__table > tbody > tr > td > .snowu').innerText == (units == 'Metric' ? 'cm' : 'in'),
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
            basicInfoObject.topLiftElevation = document.querySelector('#leftNav .elevation-control__link--top > .height').innerText + unit;
            basicInfoObject.midLiftElevation = document.querySelector('#leftNav .elevation-control__link--mid > .height').innerText + unit;
            basicInfoObject.botLiftElevation = document.querySelector('#leftNav .elevation-control__link--bot > .height').innerText + unit;
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
        const snowArray = await page.$$eval('.forecast-table-snow__container > .snow', (snowForecasts, units) => {
            const unit = (units == 'Metric' ? 'cm' : 'in');
            const snowForecastTemp = [];
            let snowForecastChunk = {};
            let startSelection = false;
            let count = 0;
            snowForecasts.forEach((snowForecast, i) => {
                if (i <= 17) {
                    if (startSelection && snowForecast.parentElement.parentElement.classList.contains('day-end')) {
                        snowForecastChunk.night = snowForecast.classList.contains('has-value') ? snowForecast.innerText + unit : '0' + unit;
                        snowForecastTemp.push(snowForecastChunk);
                        snowForecastChunk = {};
                        count = 0;
                    } else if (startSelection && count === 0) {
                        snowForecastChunk.am = snowForecast.classList.contains('has-value') ? snowForecast.innerText + unit : '0' + unit;
                        count++;
                    } else if (startSelection && count === 1) {
                        snowForecastChunk.pm = snowForecast.classList.contains('has-value') ? snowForecast.innerText + unit : '0' + unit;
                        count++;
                    } else if (!startSelection && snowForecast.parentElement.parentElement.classList.contains('day-end')) {
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

        return organizedArray;
    } catch(err) {
        console.log(err, 'getForecast')
    }
}

const handleUnitChange = async (page, url, elevation, units) => {
    try {
        //Click elevation buttons and get forecast for each elevation
        let indexStart = 0;
        let indexEnd = 2;
        if (elevation === 'top') {
            indexStart = 0;
            indexEnd = 0;
        } else if (elevation === 'mid') {
            indexStart = 1;
            indexEnd = 1;
        } else if (elevation === 'bot') {
            indexStart = 2;
            indexEnd = 2;
        }

        let weeklyForecast = {};
        let topLift;
        let midLift;
        let botLift;

        for (let i = indexStart; i <= indexEnd; i++) {
            await page.evaluate((i) => {
                const elevationBtnTop = document.querySelectorAll('#leftNav .elevation-control__link');
                elevationBtnTop[i].click();
            }, i)

            await page.waitForNavigation();

            if (i == 0) {
                await clickUnitButton(page, units);
                topLift = await getForecast(page, units);
                weeklyForecast.topLift = Object.values(topLift);
            } else if (i == 1) {
                await clickUnitButton(page, units);
                midLift = await getForecast(page, units);
                weeklyForecast.midLift = Object.values(midLift);
            } else if (i == 2) {
                await clickUnitButton(page, units);
                botLift = await getForecast(page, units);
                weeklyForecast.botLift = Object.values(botLift);
            }
        }

        //Get basic info (top/mid/bot lift elevations, lat/lon)
        const basicInfo = await getBasicInfo(page, url, units);

        let liftForecast;

        if (elevation === 'top') {
            liftForecast = topLift
        } else if (elevation === 'mid') {
            liftForecast = midLift
        } else if (elevation === 'bot') {
            liftForecast = botLift
        }

        if (elevation) {
            return {
                forecast: liftForecast,
                basicInfo
            }
        } else {
            return {
                ...weeklyForecast,
                basicInfo
            }
        }

    } catch(err) {
        console.log(err, 'handleUnitChange')
    }
}

const forecast = async (req, res, p, url) => {
    try {
        const units = req?.query?.units;
        const elevation = req?.query?.el;
        const startTime = Date.now();
        var browser = await p.launch({headless: true, args: ['--no-sandbox']});
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
        await page.goto(url, { waitUntil: 'domcontentloaded' });

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

        const totalTime = Date.now() - startTime;
        console.log(totalTime);

        const u = (units === 'm' ? 'metric' : 'imperial')
        res.json(units ? result[u] : result);
    } catch (err) {
        console.log(err, 'forecast');
    } finally {
        if (browser) {
            browser.close();
        }
    }
}

module.exports = {
    forecast
}