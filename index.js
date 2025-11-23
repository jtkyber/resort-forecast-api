import * as cheerio from 'cheerio';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import NodeCache from 'node-cache';
import p from 'puppeteer-core';
import request from 'request';

const myCache = new NodeCache();
const app = express();

dotenv.config({ path: '.env.local' });

app.use(express.json());
app.use(cors());

import { forecast } from './controllers/forecast.js';
import { getUrl } from './controllers/getUrl.js';
import { hourly } from './controllers/hourly.js';
import { resorts } from './controllers/resorts.js';
import { snowConditions } from './controllers/snowConditions.js';

let url = null;
let cacheKey;
let resortName;

//Middleware--

app.use('/', async (req, res, next) => {
	url = null;
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
		url = await getUrl(req, res, p, resortName);
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
		const result = await resorts(req, res, p, flag);
		if (result) myCache.set(`resorts_${region}`, result, 604800); // Lasts a week

		res.json(result);
	}
});

app.get('/regions', async (req, res) => {
	if (myCache.has('regions')) res.json(myCache.get('regions'));
	else {
		const result = await resorts(req, res, p, 'regions');
		if (result) myCache.set(`regions`, result, 604800); // Lasts a week

		res.json(result);
	}
});

app.get('/:resort/hourly', async (req, res) => {
	cacheKey = `${cacheKey}_hourly`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await hourly(req, res, p, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1200);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
	}
});

app.get('/:resort/forecast', async (req, res) => {
	cacheKey = `${cacheKey}_forecast`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await forecast(req, res, p, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1800);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
	}
});

app.get('/:resort/snowConditions', async (req, res) => {
	cacheKey = `${cacheKey}_snowConditions`;
	if (myCache.has(cacheKey)) res.json(myCache.get(cacheKey));
	else {
		const result = await snowConditions(req, res, cheerio, request, url);
		if (result) {
			myCache.set(`${cacheKey}`, result, 1200);
			if (!myCache.has(`url_${resortName}`)) myCache.set(`url_${resortName}`, url, 604800);
		}

		res.json(result);
	}
});

app.listen(process.env.PORT || 3001, () => {
	console.log(`app is running on port ${process.env.PORT || 3001}`);
});
