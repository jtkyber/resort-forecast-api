const scrapeCurrentWeather = async (req, res, request, cheerio) => {
    try {
        let currentWeather = {};
        const lat = req.query.lat;
        const lon = req.query.lon;
        const url = `https://darksky.net/forecast/${lat},${lon}/us12/en`;
        return new Promise(resolve => {
            request(url, (error, response, html) => {
                if (response.statusCode == 500) {
                    resolve(null);
                } else if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);

                    const icon = $('#title > .currently img').attr('src');
                    const summary = $('#title > .currently .desc .summary').text();
                    const feelsLike = $('#title > .currently .desc .summary-high-low .feels-like-text').text();
                    const minTemp = $('#title > .currently .desc .summary-high-low .low-temp-text').text();
                    const maxTemp = $('#title > .currently .desc .summary-high-low .high-temp-text').text();
                    const restOfDay = $('#title .currently__summary').text().replace(/\s\s+/g, '');

                    currentWeather = ({
                        icon: icon,
                        summary: summary,
                        feelsLike: feelsLike,
                        minTemp: minTemp,
                        maxTemp: maxTemp,
                        restOfDay: restOfDay,
                        darkSkyUrl: url
                    })

                    resolve(currentWeather);
                } else {
                    throw new Error('Error');
                }
            });
        }).then(result => {
            return result;
        })
    } catch (err) {
        console.log(err);
    }
}

const scrapeWeeklyWeather = async (req, res, request, cheerio) => {
    try {
        let weeklyWeather = [];
        const lat = req.query.lat;
        const lon = req.query.lon;
        const url = `https://darksky.net/forecast/${lat},${lon}/us12/en`;

        const iconArr = [];
        const dayArr = [];
        const minTempArr = [];
        const maxTempArr = [];

        return new Promise(resolve => {
            request(url, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);

                    const icons = $('#week .skycon img').each((i, el) => {
                        iconArr.push($(el).attr('src'));
                    });

                    const days = $('#week > .day > .date__icon__details > .name').each((i, el) => {
                        dayArr.push($(el).text().replace(/\s\s+/g, ''));
                    });

                    const minTemps = $('#week > .day > .tempRange > .minTemp').each((i, el) => {
                        minTempArr.push($(el).text());
                    });

                    const maxTemps = $('#week > .day > .tempRange > .maxTemp').each((i, el) => {
                        maxTempArr.push($(el).text());
                    });

                    for (let i = 0; i < iconArr.length; i++) {
                        weeklyWeather.push( {
                            icon: iconArr[i],
                            day: dayArr[i],
                            minTemp: minTempArr[i],
                            maxTemp: maxTempArr[i]
                        })
                    }

                    resolve(weeklyWeather.slice(1));
                } else {
                    throw new Error('Error');
                }
            });
        }).then(result => {
            return result;
        })
    } catch (err) {
        console.log(err);
    }
}

const scrapeSnowForecast = async (req, res, request, cheerio) => {
    try {
        const name = req.query.name;
        const formattedName = name.replace(/ /g,"+");
        const googleSearch = `https://www.google.com/search?q=${formattedName}+snow+forecast`;
        return new Promise(resolve => {
            request(googleSearch, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);

                    $('a').each((i, el) => {
                        const url = $(el).attr('href');
                        if (i < 50) {
                            if (url.includes('https://www.snow-forecast.com/resorts') && url.includes('6day')) {
                                const urlRegex = /(https?:\/\/[^ ]*)/;
                                const extractedUrl = url.match(urlRegex)[1];
                                const splicedUrl = extractedUrl.slice(0, extractedUrl.lastIndexOf("/"));
                                const finalUrl = splicedUrl + '/top';
                                if (finalUrl.length > 43 && finalUrl.length < 100) {
                                    resolve(finalUrl);
                                }
                            }
                        } else resolve(false)
                    });
                    resolve(false);
                } else {
                    throw new Error('Error');
                }
            })
        }).then(value => {
            return value;
        })
    } catch (err) {
        console.log(err);
    }
}

const scrapeOpenSnow = async (req, res, request, cheerio) => {
    try {
        const name = req.query.name;
        const formattedName = name.replace(/ /g,"+");
        const googleSearch = `https://www.google.com/search?q=${formattedName}+snow+report+opensnow`;

        return new Promise(resolve => {
            request(googleSearch, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);

                    $('a').each((i, el) => {
                        const url = $(el).attr('href');
                        if (i < 50) {
                            if (url.includes('https://opensnow.com/location')) {
                                const urlRegex = /(https?:\/\/[^ ]*)/;
                                const extractedUrl = url.match(urlRegex)[1];
                                const splicedUrl = extractedUrl.slice(0, extractedUrl.indexOf("&"));
                                if (splicedUrl.length > 20 && splicedUrl.length < 100) {
                                    resolve(splicedUrl);
                                }
                            }
                        } else resolve(false)
                    });
                    resolve(false);
                } else {
                    throw new Error('Error');
                }
            })
        }).then(value => {
            return value;
        })
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    scrapeCurrentWeather,
    scrapeWeeklyWeather,
    scrapeSnowForecast,
    scrapeOpenSnow
}
