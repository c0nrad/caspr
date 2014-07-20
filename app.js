var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


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
            csp_report = JSON.parse(data)['csp-report'];
            csp_report.document_uri = csp_report['document-uri'];
            csp_report.violated_directive = csp_report['violated-directive'];
            csp_report.original_policy = csp_report['original-policy'];
            csp_report.blocked_uri = csp_report['blocked-uri'];
            csp_report.status_code = csp_report['status-code'];
            req.body.csp_report = csp_report;
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
    res.header('Content-Security-Policy', "default-src 'self'; report-uri /endpoint/e73f40cd722426dd6df4c81fb56285335747fa29728bc72bd07cbcf5c2829d21");
    //res.header('Access-Control-Allow-Origin', config.allowedDomains);
    //res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    //res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 0);
    
    next();
}

app.use(allowCrossDomain);


var routes = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');
var endpoint = require('./routes/endpoint');

app.use('/', routes);
app.use('/users', users);
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
        console.log(err.message);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err.message);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
