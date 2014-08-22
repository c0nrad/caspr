var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

var async = require('async');
var _ = require('underscore');

router.get('/projects', function(req, res, next) {
  Project.find({}).exec(function(err, projects) {
    if (err) return next(err);

    res.json(projects)
  });
});

router.post('/projects', function(req, res, next) {
  req.body = _.pick(req.body, 'name')
  p = new Project(req.body);

  p.save(function(err, project) {
    if (err) return next(err);

    res.json(project);
  });
});

router.get('/projects/:id', function(req, res, next) {
  Project.findById(req.params.id).exec(function(err, project) {
    if (project === null) {
      return next('project doesn\'t exist');
    }

    if (err) return next(err);

    res.json(project);
  });
});

router.get('/projects/:id/stats', function(req, res) {
  async.auto({
    project: function(next) {
      Project.findById(req.params.id).exec(next);
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
            _id: "$csp-report",
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

module.exports = router;
