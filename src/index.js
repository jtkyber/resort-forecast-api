const request = require('request');
const cheerio = require('cheerio');
const p = require('puppeteer');
const express = require('express');
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const cors = require('cors');
const app = express();
const nodemailer = require('nodemailer');
app.use(express.json());
app.use(cors());

const getUrl = require('./controllers/getUrl');
const hourly = require('./controllers/hourly');
const forecast = require('./controllers/forecast');
const snowConditions = require('./controllers/snowConditions');

let url = null;
let result = null;
let myTimer = null;
let newUrlCached;
let bypassTimeoutCount = 0;
let params;
let query;
let mailOptions = {};

//Middleware

const assignMailOptions = () => {
    const formattedQuery = () => {
        let queryString = '';
        for (const [key, value] of Object.entries(query)) {
            console.log(key, value)
            queryString = queryString.concat(`${queryString.length ? ' | ' : ''}${key}: ${value}`)
        }
        return queryString;
    }
    mailOptions = {
        from: 'resortweatherapi@gmail.com',
        to: 'resortweatherapi@gmail.com',
        subject: `'${params?.resort}' forecast retrieval timeout`,
        html: `<h3>Server reached the maximum amount of time allowed to retrieve forecast information for '${params?.resort}'</h3>
        <p>Resort Name: ${params?.resort}</p>
        <p>Query Params: ${formattedQuery()}</p>
        <p>Url: ${url}/mid</p>`
    };
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'resortweatherapi@gmail.com',
        pass: 'Potato_16'
    }
}); 

const sendEmail = () => {
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

const waitAndSend = (req, res) => {
    if (result) {
        myCache.set(`${newUrlCached}`, result, 600)

        isFinished = true;
        clearInterval(myTimer);
        if (!res.headersSent) {
            res.json(result);
        } else res.end(JSON.stringify(result, null, 2));
    } else if (!result) {
        if (bypassTimeoutCount >= 1) {
            bypassTimeoutCount = 0;
            clearInterval(myTimer);
            sendEmail();
            res.status(400).json('Could not retrieve forecast information');
            return;
        }

        if (!res.headersSent) res.writeHead(202, {'content-type':'application/json'});
        res.write(" ");
        bypassTimeoutCount += 1;
    }
}

app.use('/', async (req, res, next) => { 
    url = null;
    result = null;
    myTimer = null;
    next();
})

app.use('/:resort', async (req, res, next) => {
    params = req.params;
    query = req.query;
    url = await getUrl.getUrl(req, request, cheerio, myCache);
    assignMailOptions();
    if (url) {
        newUrlCached = url + Object.values(req.query).sort().toString();
        if (myCache.has(newUrlCached)) {
            res.json(myCache.get(newUrlCached));
        } else {
            myTimer = setInterval(waitAndSend, 25000, req, res);
            next();
        }
    } else {
        res.status(400).json('Invalid resort name')
    }
})

//Endpoints

app.get('/', (req, res) => { res.json('Working') })

app.get('/:resort/hourly', async (req, res) => { 
    result = await hourly.hourly(req, res, p, url, myCache);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/forecast', async (req, res) => { 
    result = await forecast.forecast(req, res, p, url, myCache);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})

app.get('/:resort/snowConditions', async (req, res) => { 
    result = await snowConditions.snowConditions(req, res, cheerio, request, url, myCache);
    clearInterval(myTimer);
    myTimer = setInterval(waitAndSend, 100, req, res);
})


app.listen(process.env.PORT || 3001, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})