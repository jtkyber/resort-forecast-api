const request = require('request');
const cheerio = require('cheerio');
const p = require('puppeteer');
const express = require('express');
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const getUrl = require('./controllers/getUrl');
const hourly = require('./controllers/hourly');
const forecast = require('./controllers/forecast');
const snowConditions = require('./controllers/snowConditions');

const skiMapScrapers = require('./weatherScraper');

let url = null;
let newUrlCached;
// let resortName;
// let result = null;
// let myTimer = null;
// let bypassTimeoutCount = 0;
// let params;
// let query;

//Middleware


app.use('/', async (req, res, next) => { 
    url = null;
    // result = null;
    // myTimer = null;
    next();
})

app.use('/:resort', async (req, res, next) => {
    // params = req.params;
    // query = req.query;
    if (req?.query?.lat) {
        next();
        return;
    }
    url = await getUrl.getUrl(req, request, cheerio, myCache);
    resortName = req.params.resort;
    
    if (url) {
        newUrlCached = url + Object.values(req.query).sort().toString();
        if (myCache.has(newUrlCached)) {
            res.json(myCache.get(newUrlCached));
        } else {
            // myTimer = setInterval(waitAndSend, 25000, req, res);
            next();
        }
    } else {
        console.log(req.params.resort)
        res.status(400).json('Invalid resort name')
    }
})

//Endpoints

app.get('/', (req, res) => { res.json('Working') })

app.get('/:resort/hourly', async (req, res) => { 
    const result = await hourly.hourly(req, res, p, url, myCache);
    myCache.set(`${newUrlCached}`, result, 600)
    
    res.json(result);
    // clearInterval(myTimer);
    // myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/forecast', async (req, res) => { 
    const result = await forecast.forecast(req, res, p, url, myCache);
    myCache.set(`${newUrlCached}`, result, 600)
    
    res.json(result);
    // clearInterval(myTimer);
    // myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/snowConditions', async (req, res) => { 
    const result = await snowConditions.snowConditions(req, res, cheerio, request, url, myCache);
    myCache.set(`${newUrlCached}`, result, 600)
    
    res.json(result); 
    // clearInterval(myTimer);
    // myTimer = setInterval(waitAndSend, 100, req, res);
})


//Ski Map Scrapers

let pathPlusName;
let result;

const sendResult = (req, res) => {
    if (req.path == '/scrapeSnowForecast' || req.path == '/scrapeOpenSnow') {
        myCache.set(`${pathPlusName}`, result);
    } else {
        myCache.set(`${pathPlusName}`, result, 600);
    }
    res.json(result);
}

app.get('/scrapeCurrentWeather', async (req, res) => {
    result = await skiMapScrapers.scrapeCurrentWeather(req, res, request, cheerio);
    sendResult(req, res);
})

app.get('/scrapeWeeklyWeather', async (req, res) => { 
    result = await skiMapScrapers.scrapeWeeklyWeather(req, res, request, cheerio);
    sendResult(req, res);
})

app.get('/scrapeSnowForecast', async (req, res) => { 
    result = await skiMapScrapers.scrapeSnowForecast(req, res, request, cheerio);
    sendResult(req, res);
})

app.get('/scrapeOpenSnow', async (req, res) => {
    result = await skiMapScrapers.scrapeOpenSnow(req, res, request, cheerio);
    sendResult(req, res);
})



app.listen(process.env.PORT || 3001, () => {
    console.log(`app is running on port ${process.env.PORT || 3001}`);
})

module.exports = {
    app
}

















// const waitAndSend = (req, res) => {
//     if (result) {
//         myCache.set(`${newUrlCached}`, result, 600)

//         isFinished = true;
//         clearInterval(myTimer);
//         if (!res.headersSent) {
//             res.json(result);
//         } else res.end(JSON.stringify(result, null, 2));
//     } else if (!result) {
//         if (bypassTimeoutCount >= 1) {
//             bypassTimeoutCount = 0;
//             clearInterval(myTimer);
//             res.status(504).json('Could not retrieve forecast information within the allotted time limit');
//             return;
//         }

//         if (!res.headersSent) res.writeHead(202, {'content-type':'application/json'});
//         res.write(" ");
//         bypassTimeoutCount += 1;
//     }
// }