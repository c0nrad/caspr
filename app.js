var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('./logger');
var mongoose = require('mongoose');
var _ = require('underscore');

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/caspr';
mongoose.connect(mongoUri);

// load models
require('./models/index')

var app = express();

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');

var CSPParser = function(req, res, next) {
    if (req.get('Content-Type') == "application/csp-report") {  
        var data='';
        req.setEncoding('utf8');
        req.on('data', function(chunk) { 
           data += chunk;
        });

        req.on('end', function() {
            req.body.data = data;
            next();
        });
    } else {
        next()
    }
}

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser());
app.use(CSPParser)
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var allowCrossDomain = function(req, res, next) {
    //res.header('Content-Security-Policy', "default-src * 'unsafe-eval'; script-src 'self' 'unsafe-eval'; object-src 'none'; style-src 'self' 'unsafe-inline' 'unsafe-eval'; report-uri /endpoint/e73f40cd722426dd6df4c81fb56285335747fa29728bc72bd07cbcf5c2829d21")
    res.header('Content-Security-Policy-Report-Only', "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; font-src 'self'; report-uri https://caspr.io/endpoint/example");
    //res.header('Access-Control-Allow-Origin', config.allowedDomains);
    //res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    //res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', 0);
    
    next();
}

app.use(allowCrossDomain);


var index = require('./routes/index');
var api = require('./routes/api');
var endpoint = require('./routes/endpoint');

app.use('/', index);
app.use('/api', api);
app.use('/endpoint', endpoint);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        winston.warn(err.message);
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    winston.warn(err.message);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
