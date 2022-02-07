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

//Click buttons to expand hourly
const expandHourly = async (page, c) => {
    try {
        //1st Buttons
        const isBtn1Expand1 = await page.$$eval('.forecast-table-days__button', (btns) => {
            if (btns[0]) {
                btns[0].click();    
                return true;            
            }
            return false;
        })
        
        if (isBtn1Expand1) {
            await page.waitForSelector('.forecast-table-days__button.is-on-right');
        }
        
        const isBtn1Expand2 = await page.$$eval('.forecast-table-days__button.is-on-right', (btns) => {
            if (btns[0]) {
                btns[0].click();    
                return true;            
            }
            return false;
        })
        
        if (isBtn1Expand2) {
            await page.waitForSelector('.forecast-table-days__cell.is-changed-t-h');
        }

        //2nd Buttons
        if (!c) {
            const isBtn2Expand1 = await page.$$eval('.forecast-table-days__button', (btns) => {
                if (!btns[1].classList.contains('js-sign-up-no-free')) {
                    btns[1].click();
                    return true;
                }
                return false;
            });

            if (isBtn2Expand1) {
                await page.waitForSelector('.forecast-table-days__button.is-on-right');
            }
            
            const isBtn2Expand2 = await page.$$eval('.forecast-table-days__button.is-on-right', (btns) => {
                if (btns[0]) {
                    btns[0].click();
                    return true;
                } 
                return false;
            });

            if (isBtn2Expand2) {
                await page.waitForFunction(() => document.querySelectorAll('.forecast-table-days__cell.is-changed-t-h').length >= 2);
            }
        }
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

const getHourly = async (page, units, c) => {
    try {
        await expandHourly(page, c);
        //Get times
        const timesArray = await page.$$eval('[data-row="time"] .is-changed-t-h > .forecast-table-time__container', (times, c) => {
            const timeTemp = [];
            let count = c ? 1 : 0;
            times.forEach((time, i) => {
                if (count < 2) {
                    let timeCorrected = time.querySelector('.forecast-table-time__time').innerText;
                    if (timeCorrected == '0') {
                        timeCorrected = timeCorrected.replace('0', '12');
                    }
                    timeTemp.push(timeCorrected + time.querySelector('.forecast-table-time__period').innerText);                
                } 
                if (time?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return timeTemp;
        }, c)

        //Get summaries
        const summaryArray = await page.$$eval('[data-row="phrases"] .is-changed-t-h .forecast-table-phrases__value', (summaries, c) => {
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
                if (summary?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return summaryTemp;
        }, c)

        //Get wind speed
        const windSpeedArray = await page.$$eval('[data-row="wind"] .is-changed-t-h .wind-icon__val', (speeds, units, c) => {
            const unit = (units == 'Metric' ? 'km/h' : 'mph');
            const speedTemp = [];
            let count = c ? 1 : 0;
            speeds.forEach((speed, i) => {
                if (count < 2) {
                    speedTemp.push(speed.textContent + unit);
                } 
                if (speed?.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return speedTemp;
        }, units, c)

        //Get wind direction
        const windDirArray = await page.$$eval('[data-row="wind"] .is-changed-t-h .wind-icon__tooltip', (windDirs, c) => {
            const windDirTemp = [];
            let count = c ? 1 : 0;
            windDirs.forEach((windDir, i) => {
                if (count < 2) {
                    windDirTemp.push(windDir.textContent);
                } 
                if (windDir?.parentElement?.parentElement?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return windDirTemp;
        }, c)

        //Get snow forecast
        const snowArray = await page.$$eval('[data-row="snow"] .is-changed-t-h .forecast-table-snow__value', (snowForecasts, units, c) => {
            const unit = (units == 'Metric' ? 'cm' : 'in');
            const snowForecastTemp = [];
            let count = c ? 1 : 0;
            snowForecasts.forEach((snowForecast, i) => {
                if (count < 2) {
                    snowForecastTemp.push(parseFloat(snowForecast.innerText) ? snowForecast.innerText + unit : '0' + unit);
                } 
                if (snowForecast?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return snowForecastTemp;
        }, units, c)

        //Get rain forecast
        const rainArray = await page.$$eval('[data-row="rain"] .is-changed-t-h .forecast-table-rain__value', (rainForecasts, units, c) => {
            const unit = (units == 'Metric' ? 'mm' : 'in');
            const rainForecastTemp = [];
            let count = c ? 1 : 0;
            rainForecasts.forEach((rainForecast, i) => {
                if (count < 2) {
                    rainForecastTemp.push(parseFloat(rainForecast.innerText) ? rainForecast.innerText + unit : '0' + unit);
                } 
                if (rainForecast?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return rainForecastTemp;
        }, units, c)

        //Get max temp forecast
        const maxTempArray = await page.$$eval('[data-row="temperature-max"] .is-changed-t-h .forecast-table-temp__value', (maxTs, units, c) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const maxTtemp = [];
            let count = c ? 1 : 0;
            maxTs.forEach((maxT, i) => {
                if (count < 2) {
                    maxTtemp.push(maxT.innerText + unit);
                } 
                if (maxT?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return maxTtemp;
        }, units, c)

        //Get max temp forecast
        const minTempArray = await page.$$eval('[data-row="temperature-min"] .is-changed-t-h .forecast-table-temp__value', (minTs, units, maxTempArray, c) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const minTtemp = [];
            let count = c ? 1 : 0;
            if (minTs.length >= maxTempArray.length) {
                minTs.forEach((minT, i) => {
                    if (count < 2) {
                        minTtemp.push(minT.innerText + unit);
                    } 
                    if (minT?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                        count += 1;
                    }
                })
            } else {
                maxTempArray.forEach(() => {
                    minTtemp.push('not found')  
                })
            }
            return minTtemp;
        }, units, maxTempArray, c)

        //Get wind chill
        const windChillArray = await page.$$eval('[data-row="temperature-chill"] .is-changed-t-h .forecast-table-temp__value', (chills, units, c) => {
            const unit = (units == 'Metric' ? '°C' : '°F');
            const chillTemp = [];
            let count = c ? 1 : 0;
            chills.forEach((chill, i) => {
                if (count < 2) {
                    chillTemp.push(chill.innerText + unit);
                } 
                if (chill?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return chillTemp;
        }, units, c)

        //Get humidity
        const humidityArray = await page.$$eval('[data-row="humidity"] .is-changed-t-h .forecast-table-humidity__value', (humidityCols, c) => {
            const humidityTemp = [];
            let count = c ? 1 : 0;
            humidityCols.forEach((humidityCol, i) => {
                if (count < 2) {
                    humidityTemp.push(humidityCol.innerText + '%');
                } 
                if (humidityCol?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return humidityTemp;
        }, c)

        //Get freeze level
        const freezeLevelArray = await page.$$eval('[data-row="freezing-level"] .is-changed-t-h .forecast-table-freezing-level__value', (freezeLevels, units, c) => {
            const unit = (units == 'Metric' ? 'm' : 'ft');
            const freezeLevelTemp = [];
            let count = c ? 1 : 0;
            freezeLevels.forEach((freezeLevel, i) => {
                if (count < 2) {
                    freezeLevelTemp.push(freezeLevel.innerText + unit);
                } 
                if (freezeLevel?.parentElement?.parentElement?.classList.contains('day-end') && count < 2) {
                    count += 1;
                }
            })
            return freezeLevelTemp;
        }, units, c)

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

const handleUnitChange = async (page, url, elevation, units, c) => {
    try {
        let hourlyForecast = {};
        let basicInfo = {};

        const handleElevationChange = async (newUrl) => {
            await page.goto(newUrl, { waitUntil: 'networkidle0' });
            await clickUnitButton(page, units);
            return await getHourly(page, units, c);
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
            basicInfo = await getBasicInfo(page, url, units);
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
        const c = (req?.query?.c === 'true' ? true : null);
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
            resultMetric = await handleUnitChange(page, url, elevation, 'Metric', c)
        }
        if (units === 'i' || units === undefined) {
            resultImperial = await handleUnitChange(page, url, elevation, 'Imperial', c)
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
    hourly
}