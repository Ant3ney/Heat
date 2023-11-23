const RateLimit = require('express-rate-limit');
//const Slowdown = require('express-slow-down');
const config = require('../config.js');

exports.limit = function(app)
{
    //Restrict to access from domain only
    app.use(function(req, res, next)
    {
        //Ip address
        req.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        if(config.ip_blacklist.includes(req.ip))
            return res.status(401).send("Forbidden");

        //Check server host
        var host = req.hostname;
        if(config.api_url && host != config.api_url)
            return res.status(401).send("Forbidden");
           
        next();
    });

    //Rate limiter
    if(config.limiter_proxy)
        app.enable('trust proxy'); // only if your server is behind a reverse proxy

    app.use(RateLimit({
        windowMs: config.limiter_window,
        max: config.limiter_max, 
        skip: function(req) { return config.ip_whitelist.includes(req.ip); },
    }));
    app.auth_limiter = RateLimit({
        windowMs: config.limiter_window,  
        max: config.limiter_auth_max,
        skip: function(req) { return config.ip_whitelist.includes(req.ip); },
        handler: function (req, res) {
            res.status(429).send({error: "Too many requests!"});
        },
    });
    app.post_limiter = RateLimit({
        windowMs: config.limiter_window, 
        max: config.limiter_post_max, 
        skip: function(req) { return config.ip_whitelist.includes(req.ip); },
    });
}