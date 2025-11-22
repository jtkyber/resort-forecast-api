require('dotenv').config({ path: '.env.local' });
const request = require('request');
const cheerio = require('cheerio');
const p = require('puppeteer-core');
const express = require('express');
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const getUrl = require('./controllers/getUrl');
const resorts = require('./controllers/resorts');
const hourly = require('./controllers/hourly');
const forecast = require('./controllers/forecast');
const snowConditions = require('./controllers/snowConditions');

// const skiMapScrapers = require('./weatherScraper');

let url = null;
let cacheKey;
let resortName;
// let result = null;
// let myTimer = null;
// let bypassTimeoutCount = 0;
// let params;
// let query;

//Middleware--

app.use('/', async (req, res, next) => {
	url = null;
	// result = null;
	// myTimer = null;
	next();
});

app.use('/:resort', async (req, res, next) => {
	if (req?.query?.lat || req?.params?.resort === 'resorts' || req?.params?.resort === 'regions') {
		next();
		return;
	}

	resortName = req.params.resort.toLowerCase().replace(/\s+/g, ' ').replace(' ', '-').trim();

	if (myCache.has(`url_${resortName}`)) {
		url = myCache.get(`url_${resortName}`);
	} else {
		url = await getUrl.getUrl(req, res, p, resortName);
		// if (url) myCache.set(`url_${resortName}`, url, 604800);
	}
	cacheKey = resortName + Object.values(req.query).sort().toString();

	next();
});

//Endpoints -------

app.get('/', (req, res) => {
	res.json('Working');
});

app.get('/resorts', async (req, res) => {
	const region = req?.query?.region;
	if (myCache.has(`resorts_${region}`)) res.json(myCache.get(`resorts_${region}`));
	else {
		let flag = 'all';
		if (region) flag = 'resortsInRegion';
		const result = await resorts.resorts(req, res, p, flag);
		if (result) myCache.set(`resorts_${region}`, result, 604800); // Lasts a week

		res.json(result);
	}
});

app.get('/regions', async (req, res) => {
	if (myCache.has('regions')) res.json(myCache.get('regions'));
	else {
		const result = await resorts.resorts(req, res, p, 'regions');
		if (result) myCache.set(`regions`, result, 604800); // Lasts a week

		res.json(result);
	}
});

app.get('/:resort/hourly', async (req, res) => {
	cacheKey = `${cacheKey}_hourly`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await hourly.hourly(req, res, p, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1200);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
		// clearInterval(myTimer);
		// myTimer = setInterval(waitAndSend, 100, req, res);
	}
});

app.get('/:resort/forecast', async (req, res) => {
	cacheKey = `${cacheKey}_forecast`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await forecast.forecast(req, res, p, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1800);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
		// clearInterval(myTimer);
		// myTimer = setInterval(waitAndSend, 100, req, res);
	}
});

app.get('/:resort/snowConditions', async (req, res) => {
	cacheKey = `${cacheKey}_snowConditions`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await snowConditions.snowConditions(req, res, cheerio, request, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1200);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
		// clearInterval(myTimer);
		// myTimer = setInterval(waitAndSend, 100, req, res);
	}
});

//Ski Map Scrapers

// let pathPlusName;
// let result;

// const sendResult = (req, res) => {
//     if (req.path == '/scrapeSnowForecast' || req.path == '/scrapeOpenSnow') {
//         myCache.set(`${pathPlusName}`, result);
//     } else {
//         myCache.set(`${pathPlusName}`, result, 600);
//     }
//     res.json(result);
// }

// app.get('/scrapeCurrentWeather', async (req, res) => {
//     result = await skiMapScrapers.scrapeCurrentWeather(req, res, request, cheerio);
//     sendResult(req, res);
// })

// app.get('/scrapeWeeklyWeather', async (req, res) => {
//     result = await skiMapScrapers.scrapeWeeklyWeather(req, res, request, cheerio);
//     sendResult(req, res);
// })

// app.get('/scrapeSnowForecast', async (req, res) => {
//     result = await skiMapScrapers.scrapeSnowForecast(req, res, request, cheerio);
//     sendResult(req, res);
// })

// app.get('/scrapeOpenSnow', async (req, res) => {
//     result = await skiMapScrapers.scrapeOpenSnow(req, res, request, cheerio);
//     sendResult(req, res);
// })

app.listen(process.env.PORT || 3001, () => {
	console.log(`app is running on port ${process.env.PORT || 3001}`);
});

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
