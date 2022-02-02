const request = require('request');
const cheerio = require('cheerio');
const p = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const getUrl = require('./controllers/getUrl');
const snowConditions = require('./controllers/snowConditions');
const forecast = require('./controllers/forecast');

let url = null;

app.use('/:resort', async (req, res, next) => { 
    url = await getUrl.getUrl(req, request, cheerio);
    if (url) {
        next();
    } else {
        res.status(400).json('Invalid resort name')
    }
})

app.get('/', (req, res) => { res.json('Working') })

app.get('/:resort/forecast', (req, res) => { forecast.forecast(req, res, p, url) })

app.get('/:resort/snowConditions', (req, res) => { snowConditions.snowConditions(req, res, p, url) })

app.listen(process.env.PORT || 3001, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})