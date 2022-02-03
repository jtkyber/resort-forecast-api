const getUrl = (req, request, cheerio) => {
    try {
        const e = (req?.query?.el === 'top' || req?.query?.el === 'mid' || req?.query?.el === 'bot') ? `/${req?.query?.el}` : '/top';
        const name = req.params.resort;
        const formattedName = name.replace(/ /g,"+");
        const googleSearch = `https://www.google.com/search?q=${formattedName}+snow+forecast`;
        let snowForcastUrl;
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
                                const finalUrl = splicedUrl + e;
                                if (finalUrl.length > 48 && finalUrl.length < 100) {
                                    snowForcastUrl = finalUrl;
                                    resolve(snowForcastUrl);
                                }
                            }
                        } else resolve(false);
                    });
                    resolve(false)
                } else {
                    throw new Error('Error');
                }
            })
        }).then(value => {
            return value;
        })
    } catch (err) {
        console.log(err, 'getUrl');
    }
}

module.exports = {
    getUrl
}