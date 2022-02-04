const clickUnitButton = async (page, units) => {
    try {
        // Click corresponding units button
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

const expandHourly = async (page) => {
    try {
        //Click buttons to expand hourly
        await page.$$eval('.forecast-table-days__button', btns => btns[0].click());
        await page.waitForSelector('.forecast-table-days__button.is-on-right');

        await page.$$eval('.forecast-table-days__button.is-on-right', btns => btns[0].click());
        await page.waitForSelector('.forecast-table-days__cell.is-changed-t-h');
    } catch(err) {
        console.log(err, 'expandHourly')
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

const getHourly = async (page, units) => {
    try {
        await expandHourly(page);

        //Get times
        const timesArray = await page.$$eval('[data-row="time"] .is-changed-t-h > .forecast-table-time__container', (times) => {
            const timeTemp = [];
            times.forEach((time, i) => {
                if (!times[i+1]?.parentElement?.classList.contains('day-end')) {
                    timeTemp.push(time.querySelector('.forecast-table-time__time').innerText + time.querySelector('.forecast-table-time__period').innerText);
                }
            })
            return timeTemp;
        })

        //Get summaries
        const summaryArray = await page.$$eval('[data-row="phrases"] .is-changed-t-h .forecast-table-phrases__value', (summaries) => {
            const summaryTemp = [];
            summaries.forEach((summary, i) => {
                if (!summary[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    let sumCorrected = summary.innerText;
                    if (sumCorrected.includes('shwrs')) {
                        sumCorrected = sumCorrected.replace('shwrs', 'showers');
                    }

                    summaryTemp.push(sumCorrected);
                }
            })
            return summaryTemp;
        })

        //Get wind speed
        const windSpeedArray = await page.$$eval('[data-row="wind"] .is-changed-t-h .wind-icon__val', (speeds, units) => {
            const unit = (units == 'Metric' ? 'km/h' : 'mph');
            const speedTemp = [];
            speeds.forEach((speed, i) => {
                if (!speed[i+1]?.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains('day-end')) {
                    speedTemp.push(speed.textContent + unit);
                }
            })
            return speedTemp;
        }, units)

        //Get wind direction
        const windDirArray = await page.$$eval('[data-row="wind"] .is-changed-t-h .wind-icon__tooltip', (windDirs) => {
            const windDirTemp = [];
            windDirs.forEach((windDir, i) => {
                if (!windDir[i+1]?.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains('day-end')) {
                    windDirTemp.push(windDir.textContent);
                }
            })
            return windDirTemp;
        })

        //Get snow forecast
        const snowArray = await page.$$eval('[data-row="snow"] .is-changed-t-h .forecast-table-snow__value', (snowForecasts, units) => {
            const unit = (units == 'Metric' ? 'cm' : 'in');
            const snowForecastTemp = [];
            snowForecasts.forEach((snowForecast, i) => {
                if (!snowForecast[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    snowForecastTemp.push(parseFloat(snowForecast.innerText) ? snowForecast.innerText + unit : '0' + unit);
                }
            })
            return snowForecastTemp;
        }, units)

        //Get rain forecast
        const rainArray = await page.$$eval('[data-row="rain"] .is-changed-t-h .forecast-table-rain__value', (rainForecasts, units) => {
            const unit = (units == 'Metric' ? 'mm' : 'in');
            const rainForecastTemp = [];
            rainForecasts.forEach((rainForecast, i) => {
                if (!rainForecast[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    rainForecastTemp.push(parseFloat(rainForecast.innerText) ? rainForecast.innerText + unit : '0' + unit);
                }
            })
            return rainForecastTemp;
        }, units)

        //Get max temp forecast
        const maxTempArray = await page.$$eval('[data-row="temperature-max"] .is-changed-t-h .forecast-table-temp__value', (maxTs, units) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const maxTtemp = [];
            maxTs.forEach((maxT, i) => {
                if (!maxT[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    maxTtemp.push(maxT.innerText + unit);
                }
            })
            return maxTtemp;
        }, units)

        //Get max temp forecast
        const minTempArray = await page.$$eval('[data-row="temperature-min"] .is-changed-t-h .forecast-table-temp__value', (minTs, units, maxTempArray) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const minTtemp = [];
            if (minTs.length >= maxTempArray.length) {
                minTs.forEach((minT, i) => {
                    if (!minT[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                        minTtemp.push(minT.innerText + unit);
                    }
                })
            } else {
                maxTempArray.forEach(() => {
                    minTtemp.push('not found')  
                })
            }
            return minTtemp;
        }, units, maxTempArray)

        //Get wind chill
        const windChillArray = await page.$$eval('[data-row="temperature-chill"] .is-changed-t-h .forecast-table-temp__value', (chills, units) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const chillTemp = [];
            chills.forEach((chill, i) => {
                if (!chill[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    chillTemp.push(chill.innerText + unit);
                }
            })
            return chillTemp;
        }, units)

        //Get humidity
        const humidityArray = await page.$$eval('[data-row="humidity"] .is-changed-t-h .forecast-table-humidity__value', (humidityCols) => {
            const humidityTemp = [];
            humidityCols.forEach((humidityCol, i) => {
                if (!humidityCol[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    humidityTemp.push(humidityCol.innerText + '%');
                }
            })
            return humidityTemp;
        })

        //Get freeze level
        const freezeLevelArray = await page.$$eval('[data-row="freezing-level"] .is-changed-t-h .forecast-table-freezing-level__value', (freezeLevels, units) => {
            const unit = (units == 'Metric' ? 'm' : 'ft');
            const freezeLevelTemp = [];
            freezeLevels.forEach((freezeLevel, i) => {
                if (!freezeLevel[i+1]?.parentElement?.parentElement?.classList.contains('day-end')) {
                    freezeLevelTemp.push(freezeLevel.innerText + unit);
                }
            })
            return freezeLevelTemp;
        }, units)

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
                freezeLevel: freezeLevelArray[i]
            })
        })

        return hourlyArray;
    } catch(err) {
        console.log(err, 'getHourly')
    }
}

const handleUnitChange = async (page, url, elevation, units) => {
    try {
        let hourlyForecast = {};
        let basicInfo = {};

        const handleElevationChange = async (newUrl) => {
            await page.goto(newUrl, { waitUntil: 'networkidle0' });
            await clickUnitButton(page, units);
            return await getHourly(page, units);
        }

        if (!elevation && Object.keys(url).length === 3) {
            // for (let i = 0; i <= 2; i++) {
            //     //Go to new elevation
            //     await page.evaluate((i) => {
            //         const elevationBtn = document.querySelectorAll('#leftNav .elevation-control__link');
            //         elevationBtn[i].click();
            //     }, i)
    
            //     await page.waitForNavigation();
    
            //     if (i == 0) {
            //         await clickUnitButton(page, units);
            //         hourlyForecast.topLift = await getHourly(page, units);
            //     } else if (i == 1) {
            //         await clickUnitButton(page, units);
            //         hourlyForecast.midLift = await getHourly(page, units);
            //     } else if (i == 2) {
            //         await clickUnitButton(page, units);
            //         hourlyForecast.botLift = await getHourly(page, units);
            //     }

            hourlyForecast.topLift = await handleElevationChange(url.top);
            hourlyForecast.midLift = await handleElevationChange(url.mid);
            hourlyForecast.botLift = await handleElevationChange(url.bot);
            basicInfo = await getBasicInfo(page, url.top, units);
        } else {
            hourlyForecast.forecast = await handleElevationChange(url);;
            basicInfo = await getBasicInfo(page, url.top, units);
        }

        return {
            ...hourlyForecast,
            basicInfo
        }

    } catch(err) {
        console.log(err, 'handleUnitChange')
    }
}

const hourly = async (req, res, p, scrapedUrl) => {
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

        const units = req?.query?.units;
        const elevation = (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') ? req?.query?.el : null;
        var browser = await p.launch({headless: true, args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.setDefaultTimeout(90000);
        await page.setRequestInterception(true);

        //Skip loading of imgs/stylesheets/media
        page.on('request', request => {
            if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet'  || request.resourceType() === 'media'  || request.resourceType() === 'font')
                request.abort();
            else
                request.continue();
        });

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
        res.json(units ? result[u] : result);
    } catch (err) {
        console.log(err, 'forecast');
    } finally {
        await browser?.close();
    }
}

module.exports = {
    hourly
}