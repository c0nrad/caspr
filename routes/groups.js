'use strict';

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');
var Filter = mongoose.model('Filter');

var async = require('async');
var _ = require('underscore');
var moment = require('moment');

var util = require('./util');

router.get('/projects/:hash/groups', function(req, res, next) {

  req.query = _.defaults(req.query, {
    endDate: new Date(),
    startDate: moment().subtract('day', 1).toDate(),
    directives: ['default-src', 'script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'media-src', 'object-src'],
    limit: 50,
    bucket: 60 * 60,
    filters: false,
    filterExclusion: true,
    seriesCount: 0
  });

  var startDate = new Date( Number(req.query.startDate));
  var endDate = new Date( Number(req.query.endDate));
  var directives = req.query.directives;
  var limit = Number(req.query.limit);
  var bucket = Number(req.query.bucket);
  var doFilter = JSON.parse(req.query.filters);
  var filterExclusion = JSON.parse(req.query.filterExclusion);
  var seriesCount = Number(req.query.seriesCount);

  if (!_.isArray(directives)) {
    directives = [directives];
  }

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filters: ['project', function(next, results) {
      var project = results.project;
      if (!project) {
        return next('project does not exist');
      }
      Filter.find({project: project._id}, next);
    }],

    groupBuckets: ['project', 'filters', function(next, results) {
      var project = results.project;
      var filters = doFilter ? results.filters : [];

      return util.aggregateGroups(startDate, endDate, directives, limit, project._id, filters, filterExclusion, next);
    }],

    filteredBuckets: ['groupBuckets', 'filters', function(next, results) {
      var groups = results.groupBuckets;
      var filters = results.filters;

      var filteredGroups = util.filterGroups(filters, groups);
      return next(null, filteredGroups);
    }],

    groups: ['groupBuckets', 'filteredBuckets', function(next, results) {
      var groups = results.filteredBuckets;
      var count = groups.length;

      if (seriesCount !== -1) {
        count = Math.min(seriesCount, count);
      }

      for (var i = 0; i < count; ++i) {
        groups[i].data = util.buckets(bucket, startDate, endDate, groups[i].data);
      }

      return next(null, groups);
    }]

  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.json(results.groups);
  });
});

router.get('/projects/:hash/groups/:report', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    report: ['project', function(next, results) {
      var project = results.project;
      if (!project) {
        return next('not a valid project');
      }
      Report.findOne({_id: req.params.report, project: project._id}, next);
    }],

    reports: ['report', function(next, results) {
      var project = results.project;
      var report = results.report;
      Report.find({project: project._id, 'raw': report.raw}, next);
    }],

    group: ['reports', function(next, results) {
      var reports = results.reports;
      var report = results.report;

      var dates = _.pluck(reports, 'ts');

      var group = {
        report: reports[0],
        data: util.buckets(req.query.bucket, req.query.startDate, req.query.endDate, dates),
        count: reports.length,
        name: report.name,
        firstSeen: dates[0],
        lastSeen: dates[dates.length-1]
      };

      next(null, group);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(results.group);
  });
});

module.exports = router;
