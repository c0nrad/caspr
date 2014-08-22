var express = require('express');
var route = express.Router();
var async = require('async');
var mongoose = require('mongoose');

var logger = require('../logger');

var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

route.post('/:id', function(req, res) {
  var id = req.params.id;

  async.auto({
    project: function(next) {
      Project.findById(id).exec(next)
    },

    report: ['project', function(next, results) {

      var project = results.project;
      if (project == undefined)
        return next("Project doesn't exist.");

      if (req.body.data == undefined || req.body.data === "")
        return next('Not a valid report');

      var report = JSON.parse(req.body.data)['csp-report'];

      var r = new Report({
        project: project._id,
        raw: req.body.data,
        'csp-report': report,
        ip: req.ip,
        headers: JSON.stringify(req.headers),
        directive: getDirective(report),
        classification: getType(report),
        name: getName(report),
      })

      r.save(next);
    }],

    lastSeenPolicy: ['project', 'report', function(next, results) {
      var project = results.project;
      var report = results.report[0];

      if (report['csp-report']['original-policy'] !== "")
        project.policy = report['csp-report']['original-policy'];

      project.save(next);
    }]

  }, function(err, results) {
    if (err) {
      logger.error(err);
      return res.send(err, 400);
    }

    res.send('Okay');
  })
})

function getDirective(report) {
  var directive = report['violated-directive'];
  if (directive !== undefined && directive !== "") {
    directive = directive.split(' ')[0];
  }
  return directive;
}

function getType(report) {
  var directive = getDirective(report);

  // XXX: Better typing. https://blog.matatall.com/
  if (report['blocked-uri'] === "" || report['blocked-uri'] === "self") {
    return 'inline-'+directive.split('-')[0]
  } else {
    return "unauthorized-host"
  }
}

function getName(report) {
  return getDirective(report) + " - " + getType(report) + " - " + report['document-uri'] + " - " + report['blocked-uri'];
}

module.exports = route