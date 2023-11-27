const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const config = require('./config.js');
const Limiter = require('./tools/limiter.tool');
const mongoose = require("mongoose");

const app = express();

// CONNECTION TO DATABASE
var user = ""; //User is optional if auth not enabled
if(config.mongo_user && config.mongo_pass)
	user = config.mongo_user + ":" + config.mongo_pass + "@";

var connect = "mongodb://" + user + config.mongo_host + ":" + config.mongo_port + "/" + config.mongo_db + "?authSource=admin";
mongoose.set('strictQuery', false);
mongoose.connect(connect);
mongoose.connection.on("connected", () => {
  console.log("Mongoose is connected!");
});

//Limiter to prevent attacks
Limiter.limit(app);

//Headers
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.send(200);
    } else {
        return next();
    }
});

//Parse JSON body
app.use(express.json({ limit: "100kb" }));

//Log request
app.use((req, res, next) => {
    var today = new Date();
    var date = today.getFullYear() +'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var date_tag = "[" + date + " " + time + "]";
    console.log(date_tag + " " + req.method + " " + req.originalUrl);
    next();
})

//Route root DIR
app.get('/', function(req, res){
    res.status(200).send(config.api_title + " " + config.version);
});

//Public folder 
app.use('/', express.static('public'))

//Routing
const AuthorizationRouter = require('./authorization/auth.routes');
AuthorizationRouter.route(app);

const UsersRouter = require('./users/users.routes');
UsersRouter.route(app);

const CardsRouter = require('./cards/cards.routes');
CardsRouter.route(app);

const PacksRouter = require('./packs/packs.routes');
PacksRouter.route(app);

const DecksRouter = require('./decks/decks.routes');
DecksRouter.route(app);

const VariantRouter = require('./variants/variants.routes');
VariantRouter.route(app);

const MatchesRouter = require('./matches/matches.routes');
MatchesRouter.route(app);

const RewardsRouter = require('./rewards/rewards.routes');
RewardsRouter.route(app);

const MarketRouter = require('./market/market.routes');
MarketRouter.route(app);

const ActivityRouter = require("./activity/activity.routes");
ActivityRouter.route(app);


//HTTP
if(config.allow_http){
    var httpServer = http.createServer(app);
    httpServer.listen(config.port, function () {
        console.log('http listening port %s', config.port);
    });
}

//HTTPS
if(config.allow_https && fs.existsSync(config.https_key)) {
    var privateKey  = fs.readFileSync(config.https_key, 'utf8');
    var certificate = fs.readFileSync(config.https_cert, 'utf8');
    var cert_authority = fs.readFileSync(config.https_ca, 'utf8');
    var credentials = {key: privateKey, cert: certificate, ca: cert_authority};
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(config.port_https, function () {
        console.log('https listening port %s', config.port_https);
    });
}

//Start jobs
const Jobs = require("./jobs/jobs");
Jobs.InitJobs();

module.exports = app