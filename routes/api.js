'use strict;'

var express = require('express');
var router = express.Router();
var baucis = require('baucis');
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

var ReportController = baucis.rest('Report');

router.get('/projects', function(req, res, next) {
  Project.find({}).exec(function(err, projects) {
    if (err) return next(err);

    res.json(projects)
  });
});

router.post('/projects', function(req, res, next) {
  req.body = _.pick(req.body, 'name')
  console.log(req.body)
  p = new Project(req.body);

  p.save(function(err, project) {
    if (err) return next(err);

    res.json(project);
  });
});

router.get('/projects/:hash', function(req, res, next) {
  console.log(req.params, req.body, req.query)
  Project.findOne({hash: req.params.hash}).exec(function(err, project) {
    if (project === null) {
      return next('project doesn\'t exist');
    }

    if (err) return next(err);

    res.json(project);
  });
});

router.get('/projects/:hash/groups', function(req, res) {
  var startDate = new Date( Number(req.query.startDate))
  var endDate = new Date( Number(req.query.endDate))
  var directives = req.query.directives
  var limit = Number(req.query.limit);
  var bucket = Number(req.query.bucket);

  if (!_.isArray(directives))
    directives = [directives];

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}).exec(function(err, project) {
        if (project === null) {
          return next('project doesn\'t exist');
        }
        next(err, project);
      });
    },

    reportCount: ["project", function(next, results) {
      var project = results.project;
      Report.aggregate([
        { 
          $match: {
            project: project._id,
            ts: {$gt: startDate, $lt: endDate},
            directive: {$in: directives}
          }
        },
        {
          $group: {
            _id: null,
            count: {$sum: 1}
          }
        }
      ]).exec(function(err, reports) {
        if (err)
          return next(err);
        if (reports.length == 0)
          return next(err, 0);
        next(err, reports[0].count);
      });
    }],

    groupCount: ["project", function(next, results) {
      var project = results.project;
      Report.aggregate([
        { 
          $match: {
            project: project._id,
            ts: {$gt: startDate, $lt: endDate},
            directive: {$in: directives}
          }
        },

        {
          $group: {
            _id: "$csp_report",
          } 
        },

        {
          $group: {
            _id: null,
            count: {$sum: 1}
          }
        }
      ]).exec(function(err, reports) {
        if (err)
          return next(err);
        if (reports.length == 0)
          return next(err, 0);
        next(err, reports[0].count);
      });
    }],

    groupBuckets: ['project', function(next, results) {
      var project = results.project;
      
      return aggregateGroups(startDate, endDate, directives, limit, bucket, project._id, next);
    }],

    groups: ['groupBuckets', function(next, results) {
      var groups = results.groupBuckets;

      for (var i = 0; i < groups.length; ++i) {
        groups[i].data = buckets(bucket, startDate, endDate, groups[i].data);
      }

      return next(null, groups);
    }]

  }, function(err, results) {
    res.json(results);
  });
});

router.get('/projects/:hash/stats', function(req, res) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}).exec(next);
    },

    totalReports: ['project', function(next, results) {
      var project = results.project;
      Report.find({project: project._id}).count(next);
    }],

    uniqueReportsTotal: ['project', function(next, results) {
      var project = results.project;

      Report.aggregate([
        {
          $match: {
            project: project._id
          }
        },
        {
          $group: {
            _id: "$csp_report",
          }
        }
      ]).exec(function(err, groups) {
        next(err, groups.length);
      });
    }],

    dateLastActivity: ['project', function(next, results) {
      var project = results.project;
      Report.find({project: project._id}, "ts").sort({ts: -1}).limit(1).exec(function(err, results) {
        if (results.length == 0) return next(err, 0);
        next(err, results[0].ts);
      })
    }]
  }, function(err, results) {
    res.send(results);
  });
});

router.use('/', baucis());
module.exports = router;

function buckets(bucketSize, startDate, endDate, data) {
  var hist = {};
  hist[Math.round(startDate/1000)] = 0;
  hist[Math.round(endDate/1000)] = 0;
  for (var i = 0 ; i < data.length; ++i) {

    var reportDate = Math.round(data[i].getTime()/1000);
    reportDate -= (reportDate % bucketSize);
    if (hist[reportDate] === undefined) {
      hist[reportDate] = 0;
    }
    hist[reportDate] += 1;
  }

  var keys = _.keys(hist);
  var out = [];
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];
    out.push({x: Number(key), y: hist[key] });
  }

  out = _.sortBy(out, function(a) {return a.x})

  return out;
}

function aggregateGroups(startDate, endDate, directives, limit, bucket, projectId, next) {
  Report.aggregate([
    {
      $match: {
        project: projectId,
        ts: {$gt: startDate, $lt: endDate},
        directive: {$in: directives}
      }
    },

    {
      $group: {
        _id: "$csp_report",
        count: {$sum: 1},
        csp_report: {$last: "$csp_report"},
        data: { $push: "$ts" },
        latest: { $max: "$ts" },
        directive: {$last: "$directive" },
      } 
    },

    {
      $project: {
        count: 1,
        csp_report: 1,
        data: 1,
        latest: 1,
        directive: 1,
        name: { $concat: [ "$directive", " - ", "$csp_report.document_uri", " - ", "$csp_report.blocked_uri"]}
      }
    },

    {
      $sort : {
        count: -1
      }

    },

    {
      $limit: limit
    }
  ]).exec(next);
}
