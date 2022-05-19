const getUrl = (req, request, cheerio, myCache) => {
    try {
        const name = req.params.resort;
        if (myCache.has(name)) {
            return (myCache.get(name));
        }

        const formattedName = name.replace(/ /g,"+");
        const googleSearch = `https://www.google.com/search?q=${formattedName}+snow+forecast+6day`;
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
                                const finalUrl = splicedUrl;
                                if (finalUrl.length > 43 && finalUrl.length < 100) {
                                    myCache.set(`${name}`, finalUrl);
                                    resolve(finalUrl);
                                    return false
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
        console.log(err, 'getUrl');
    }
}

module.exports = {
    getUrl
}