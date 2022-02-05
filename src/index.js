const request = require('request');
const cheerio = require('cheerio');
const p = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const getUrl = require('./controllers/getUrl');
const hourly = require('./controllers/hourly');
const forecast = require('./controllers/forecast');
const snowConditions = require('./controllers/snowConditions');

let url = null;
let result = null;
let myTimer = null;

//Middleware

const waitAndSend = (req, res) => {
    if (result) {
        isFinished = true;
        clearInterval(myTimer);
        res.end(JSON.stringify(result, null, 2));
    } else if (!result) {
        if (!res.headersSent) {
            res.writeHead(200, {'content-type':'application/json'});
        }
        res.write(" ");
    }
}

app.use('/', async (req, res, next) => { 
    url = null;
    result = null;
    myTimer = null;
    next();
})

app.use('/:resort', async (req, res, next) => {
    url = await getUrl.getUrl(req, request, cheerio);
    if (url) {
        myTimer = setInterval(waitAndSend, 2000, req, res);
        next();
    } else {
        res.status(400).json('Invalid resort name')
    }
})

//Endpoints

app.get('/', (req, res) => { res.json('Working') })

app.get('/:resort/hourly', async (req, res) => { 
    result = await hourly.hourly(req, res, p, url);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/forecast', async (req, res) => { 
    result = await forecast.forecast(req, res, p, url);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/snowConditions', async (req, res) => { 
    result = await snowConditions.snowConditions(req, res, cheerio, request, url);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})


app.listen(process.env.PORT || 3001, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})