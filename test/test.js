var request = require('request');
var reports = require('./twitter.json');
var async = require('async');


var HOST = "http://localhost:3000"
var PROJECT = { __v: 0, _id: '53fc9c3b848738830d0f5e71', policy: '', endpoint: 'd72c723219e1a8dbb8817363034d8a403e231934a21b802a818b0708b6563759', hash: 'e56782a2a2c80c89653884d76cb367df7a2823726b27b5d44144e9e0999fed84', name: 'test1408567936874' }
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

        var URL = HOST + "/endpoint/" + project.endpoint;
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
