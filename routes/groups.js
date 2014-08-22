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
    bucket: 60 * 60
  })

  var startDate = new Date( Number(req.query.startDate))
  var endDate = new Date( Number(req.query.endDate))
  var directives = req.query.directives
  var limit = Number(req.query.limit);
  var bucket = Number(req.query.bucket);

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
      var filters = results.filters
      
      return util.aggregateGroups(startDate, endDate, directives, limit, bucket, project._id, filters, next);
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

module.exports = router;