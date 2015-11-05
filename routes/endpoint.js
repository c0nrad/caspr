'use strict';

var express = require('express');
var router = express.Router();
var async = require('async');
var mongoose = require('mongoose');

var logger = require('../logger');

var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

var url = require('url');

router.post('/:endpoint', function(req, res) {
  var endpoint = req.params.endpoint;

  async.auto({
    project: function(next) {
      Project.findOne({endpoint: endpoint}).exec(next);
    },

    report: ['project', function(next, results) {

      var project = results.project;
      if (!project) {
        return next('Project doesn\'t exist.');
      }

      if (!req.body.data) {
        return next('Not a valid report');
      }

      var report = JSON.parse(req.body.data)['csp-report'];
      report = sanitizeReport(report);

      var r = new Report({
        project: project._id,

        original: req.body.data,
        ip: req.ip,
        headers: JSON.stringify(req.headers),

        raw: JSON.stringify(report),
        'csp-report': report,

        directive: getDirective(report),
        classification: getType(report),
        name: getName(report),
      });

      r.save(next);
    }],

    lastSeenPolicy: ['project', 'report', function(next, results) {
      var project = results.project;
      var report = results.report[0];

      if (!!report['csp-report']['original-policy']) {
        project.policy = report['csp-report']['original-policy'];
      }

      project.save(next);
    }]

  }, function(err) {
    if (err) {
      logger.error(err);
      return res.send(err, 400);
    }

    res.send('Okay');
  });
});

function getDirective(report) {
  var directive = report['violated-directive'];
  if (directive !== undefined && directive !== '') {
    directive = directive.split(' ')[0];
  }
  return directive;
}

function getType(report) {
  if (report['blocked-uri'] === '' || report['blocked-uri'] === 'self') {
    return 'inline';
  } else {
    return 'unauthorized-host';
  }
}

function getName(report) {
  return getDirective(report) + ' - ' + getType(report) + ' - ' + report['document-uri'] + ' - ' + report['blocked-uri'];
}

function stripQuery(uri) {
  if (!uri) {
    return uri;
  }

  var urlObj = url.parse(uri);
  urlObj.query = '';
  urlObj.search = '';
  urlObj.hash = '';
  return url.format(urlObj);
}

function stripPath(uri) {
  if (!uri) {
    return uri;
  }

  var urlObj = url.parse(uri);
  urlObj.query = '';
  urlObj.search = '';
  urlObj.hash = '';
  urlObj.path = '';
  urlObj.pathname = '';
  return url.format(urlObj);
}

function sanitizeReport(report) {
  report['document-uri'] = stripQuery(report['document-uri']);
  report['blocked-uri'] = stripPath(report['blocked-uri']);
  return report;
}

module.exports = router;
