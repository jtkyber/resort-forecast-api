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

const getSnowConditions = async (page, units) => {
    try {
        const unit = units === 'Metric' ? 'cm' : 'in';
        const snowDepth = await page.evaluate((unit) => {
            const snowDepthObject = {};
            const snowDepthRows = document.querySelectorAll('.snow-depths-table__table > tbody > tr');
            snowDepthRows.forEach(row => {
                if (row.childNodes[0].innerText.toLowerCase() === 'top snow depth:') {
                    snowDepthObject.topSnowDepth = row.childNodes[1].childNodes[0].innerText ? row.childNodes[1].childNodes[0].innerText + unit : 'not found';
                } else if (row.childNodes[0].innerText.toLowerCase() === 'bottom snow depth:') {
                    snowDepthObject.botSnowDepth = row.childNodes[1].childNodes[0].innerText ? row.childNodes[1].childNodes[0].innerText + unit : 'not found';
                } else if (row.childNodes[0].innerText.toLowerCase() === 'fresh snowfall depth:') {
                    snowDepthObject.freshSnowfall = row.childNodes[1].childNodes[0].innerText ? row.childNodes[1].childNodes[0].innerText + unit : 'not found';
                } else if (row.childNodes[0].innerText.toLowerCase() === 'last snowfall:') {
                    snowDepthObject.lastSnowfallDate = row.childNodes[1].innerText ? row.childNodes[1].innerText : 'not found';
                }
            })
            return snowDepthObject;
        }, unit)
        return snowDepth;
    } catch(err) {
        console.log(err, 'getSnowConditions')
    }
}

const handleUnitChange = async (page, url, units) => {
    try {
        await clickUnitButton(page, units);

        //Get basic info (top/mid/bot lift elevations, lat/lon)
        const basicInfo = await getBasicInfo(page, url, units);

        //Get data from snow conditions section at bottom of page
        const snowConditions = await getSnowConditions(page, units)

        return {
            ...snowConditions,
            basicInfo
        }
    } catch(err) {
        console.log(err, 'handleUnitChange')
    }
}

const snowConditionsPup = async (req, res, p, url) => {
    try {
        const units = req?.query?.units;
        const startTime = Date.now();
        var browser = await p.launch({headless: true, args: ['--no-sandbox']});
        const page = await browser.newPage();
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
            resultMetric = await handleUnitChange(page, url, 'Metric')
        }
        if (units === 'i' || units === undefined) {
            resultImperial = await handleUnitChange(page, url, 'Imperial')
        }
        
        const result = {
            metric: resultMetric,
            imperial: resultImperial
        }

        const totalTime = Date.now() - startTime;
        console.log(totalTime);
        res.json(result);
    } catch (err) {
        console.log(err, 'snowConditions');
    } finally {
        if (browser) {
            browser.close();
        }
    }
}

module.exports = {
    snowConditionsPup
}