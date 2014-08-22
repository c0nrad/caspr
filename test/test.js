var request = require('request');
var reports = require('./twitter.json');
var async = require('async');


var HOST = "http://localhost:3000"
var PROJECT = { __v: 0, _id: '53f6b5d711cde30eb23637b6', policy: '', hash: '9b83bc59a1d4d211df2d4376a3b6496a9de0d4d02e4b48f138b0d0e254dc9ade', name: 'test1408567936874' }
//var PROJECT = undefined

// Create a project
async.auto({

    project: function(next) {
        if (PROJECT != undefined)
            return next(null, PROJECT);

        request.post(HOST+"/api/projects", {form: {name: "test" + new Date().getTime() }}, function (error, response, body) {
            next(error, JSON.parse(body));
        })
    },

    reports: function(next) {
        var reports = require('./twitter.json');
        if (reports.reports.length == 0)
            return next('No reports found!');
        next(null, reports.reports);
    },

    postReports: ["project", "reports", function(next, results) {
        var project = results.project;
        var reports = results.reports;

        console.log("ABC", project._id);

        var URL = HOST + "/endpoint/" + project._id;
        for (var i = 0; i < reports.length; ++i) {
            request.post(URL, {headers: {'Content-Type':'application/csp-report'}, body: JSON.stringify(reports[i])}, function(err, response, body) {
                if (err) return next(err);
            })
        }
        next();
    }]


}, function(err, results) {
    if (err)
        console.log(err, results);
    var project = results.project;
    console.log(project);
    console.log(HOST + "/#/p/" + project._id);
});
