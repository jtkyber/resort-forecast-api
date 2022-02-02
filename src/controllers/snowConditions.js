const toMetric = (value, desiredUnit) => {
    if (desiredUnit === 'ft') {
        return Math.round(parseInt(value) / 3.281);
    } else if (desiredUnit === 'in') {
        return Math.round(parseInt(value) * 2.54);
    } else {
        return value;
    }
}

const toImperial = (value, desiredUnit) => {
    if (desiredUnit === 'm') {
        return Math.round(parseInt(value) * 3.281);
    } else if (desiredUnit === 'cm') {
        return Math.round(parseInt(value) / 2.54);
    } else {
        return value;
    }
}

const getBasicInfo = ($, url, pageUnits, units) => {
    try {
        const unit = (units === 'Metric' ? 'm' : 'ft');
        const desiredUnits = (units === 'Metric' ? 'ft' : 'm');
        const convert = (units === 'Metric' ? toMetric : toImperial);
        const basicInfo = {};

        $('.location-breadcrumbs__item > .location-breadcrumbs__link').each((i, el) => {
            if (i === 1) {
                basicInfo.region = $(el).text();
                return;
            }
        })

        $('.location-breadcrumbs__item > .location-breadcrumbs__name').each((i, el) => {
            if (i === 0) {
                basicInfo.name = $(el).text();
                return;
            }
        })

        basicInfo.url = url;

        const topLiftElevation = $('#leftNav .elevation-control__link--top > .height').text();
        basicInfo.topLiftElevation = (pageUnits !== units ? convert(parseInt(topLiftElevation), desiredUnits).toString() : topLiftElevation) + unit;

        const midLiftElevation = $('#leftNav .elevation-control__link--mid > .height').text();
        basicInfo.midLiftElevation = (pageUnits !== units ? convert(parseInt(midLiftElevation), desiredUnits).toString() : midLiftElevation) + unit;

        const botLiftElevation = $('#leftNav .elevation-control__link--bot > .height').text();
        basicInfo.botLiftElevation = (pageUnits !== units ? convert(parseInt(botLiftElevation), desiredUnits).toString() : botLiftElevation) + unit;

        basicInfo.lat = $('.longitude').attr('title');

        basicInfo.lon = $('.latitude').attr('title');
        
        return basicInfo;
    } catch(err) {
        console.log(err, 'getBasicInfo')
    }
}

const getSnowConditions = ($, pageUnits, units) => {
    try {
        const unit = (units === 'Metric' ? 'cm' : 'in');
        const desiredUnits = (units === 'Metric' ? 'in' : 'cm');
        const convert = (units === 'Metric' ? toMetric : toImperial);
        const snowDepthObject = {};

        $('.snow-depths-table__table > tbody > tr').each((i, row) => {
            if ($(row).find('th').text().toLowerCase() === 'top snow depth:') {
                const topSnowDepth = $(row).find('.snowht').text() ? $(row).find('.snowht').text() : 'not found';
                if (parseInt(topSnowDepth)) {
                    snowDepthObject.topSnowDepth = (pageUnits !== units ? convert(parseInt(topSnowDepth), desiredUnits).toString() : topSnowDepth) + unit;
                }
            } else if ($(row).find('th').text().toLowerCase() === 'bottom snow depth:') {
                const botSnowDepth = $(row).find('.snowht').text() ? $(row).find('.snowht').text() : 'not found';
                if (parseInt(botSnowDepth)) {
                    snowDepthObject.botSnowDepth = (pageUnits !== units ? convert(parseInt(botSnowDepth), desiredUnits).toString() : botSnowDepth) + unit;  
                }
            } else if ($(row).find('th').text().toLowerCase() === 'fresh snowfall depth:') {
                const freshSnowfall = $(row).find('.snowht').text() ? $(row).find('.snowht').text() : 'not found';
                if (parseInt(freshSnowfall)) {
                    snowDepthObject.freshSnowfall = (pageUnits !== units ? convert(parseInt(freshSnowfall), desiredUnits).toString() : freshSnowfall) + unit;
                }
            } else if ($(row).find('th').text().toLowerCase() === 'last snowfall:') {
                snowDepthObject.lastSnowfallDate = $(row).find('td').text() ? $(row).find('td').text().trim() : 'not found';
            }
        })
        
        return snowDepthObject;
    } catch(err) {
        console.log(err, 'getSnowConditions')
    }
}

const snowConditions = (req, res, cheerio, request, url) => {
    try {
        const units = req?.query?.units;
        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);

                const pageUnits = $('.forecast-table-wind__header-container .windu').text() === 'mph' ? 'Imperial' : 'Metric';

                let snowConditionsMetric = {};
                let basicInfoMetric = {};
                let snowConditionsImperial = {};
                let basicInfoImperial = {};

                if (units === 'm' || units === undefined) {
                    snowConditionsMetric = getSnowConditions($, pageUnits, 'Metric');
                    basicInfoMetric = getBasicInfo($, url, pageUnits, 'Metric');
                }
                if (units === 'i' || units === undefined) {
                    snowConditionsImperial = getSnowConditions($, pageUnits, 'Imperial');
                    basicInfoImperial = getBasicInfo($, url, pageUnits, 'Imperial');
                }
                
                let result = {
                    metric: {
                        ...snowConditionsMetric,
                        basicInfo: basicInfoMetric
                    },
                    imperial: {
                        ...snowConditionsImperial,
                        basicInfo: basicInfoImperial
                    }
                }

                const u = (units === 'm' ? 'metric' : 'imperial')
                res.json(units ? result[u] : result);
            } else {
                throw new Error('Error');
            }
        })
    } catch (err) {
        console.log(err, 'getUrl');
    }
}

module.exports = {
    snowConditions
}