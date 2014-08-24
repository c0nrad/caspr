var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');
var Filter = mongoose.model('Filter');

var async = require('async');
var _ = require('underscore');
var moment = require('moment');

var util = require('./util')

router.get('/projects/:id/groups', function(req, res, next) {

  req.query = _.defaults(req.query, {
    endDate: new Date(),
    startDate: moment().subtract('day', 1).toDate(),
    directives: ["default-src", "script-src", "style-src", "img-src", "font-src", "connect-src", "media-src", "object-src"],
    limit: 50,
    bucket: 60 * 60,
    filters: false,
    filterExclusion: true
  })

  var startDate = new Date( Number(req.query.startDate))
  var endDate = new Date( Number(req.query.endDate))
  var directives = req.query.directives
  var limit = Number(req.query.limit);
  var bucket = Number(req.query.bucket);
  var doFilter = JSON.parse(req.query.filters);
  var filterExclusion = JSON.parse(req.query.filterExclusion);

  if (!_.isArray(directives))
    directives = [directives];

  async.auto({
    project: function(next) {
      Project.findById(req.params.id, next)
    },

    filters: function(next) {
      Filter.find({project: req.params.id}, next)
    },

    groupBuckets: ['project', 'filters', function(next, results) {
      var project = results.project;
      var filters = doFilter ? results.filters : []

      return util.aggregateGroups(startDate, endDate, directives, limit, project._id, filters, filterExclusion, next);
    }],

    filteredBuckets: ["groupBuckets", "filters", function(next, results) {
      var groups = results.groupBuckets;
      var filters = results.filters;

      var filteredGroups = util.filterGroups(filters, groups);
      return next(null, filteredGroups);
    }],

    groups: ['groupBuckets', 'filteredBuckets', function(next, results) {
      var groups = results.filteredBuckets;

      for (var i = 0; i < groups.length; ++i) {
        groups[i].data = util.buckets(bucket, startDate, endDate, groups[i].data);
      }

      return next(null, groups);
    }]

  }, function(err, results) {
    if (err) return next(err);
    res.json(results.groups);
  });
});

router.get('/projects/:id/groups/:report', function(req, res, next) {
  console.log('hai');
  async.auto({
    project: function(next) {
      Project.findById(req.params.id, next)
    },

    report: function(next) {
      Report.findById(req.params.report, next)
    },

    reports: ["report", function(next, results) {
      var project = results.project;
      var report = results.report
      Report.find({project: project._id, 'raw': report['raw']}, next)
    }],

    group: ["reports", function(next, results) {
      console.log('haihaihai');
      var reports = results.reports;
      var report = results.report;

      var dates = _.pluck(reports, 'ts')

      var group = {
        report: reports[0],
        data: util.buckets(req.query.bucket, req.query.startDate, req.query.endDate, dates),
        count: reports.length,
        name: report.name,
        firstSeen: dates[0],
        lastSeen: dates[dates.length-1]
      }

      next(null, group)
    }]


  }, function(err, results) {
    console.log(err)
    res.send(results.group);
  });

})

module.exports = router;