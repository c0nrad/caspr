'use strict';

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');
var Filter = mongoose.model('Filter');

var async = require('async');
var _ = require('underscore');

router.get('/projects', function(req, res, next) {
  Project.find({hidden: false}).exec(function(err, projects) {
    if (err) {
      return next(err);
    }

    res.json(projects);
  });
});

router.post('/projects', function(req, res, next) {
  req.body = _.pick(req.body, 'name');
  var p = new Project(req.body);

  p.save(function(err, project) {
    if (err) {
      return next(err);
    }

    res.json(project);
  });
});

router.put('/projects/:hash', function(req, res, next) {
  var params = _.pick(req.body, 'name', 'hidden');
  Project.findOne({hash: req.params.hash}).exec(function(err, project) {
    if (!project) {
      return next('project does not exist');
    }
    _.extend(project, params);
    project.save(function(err, results) {
      if (err) {
        res.send(results);
      }
    });
  });
});

router.get('/projects/:hash', function(req, res, next) {
  Project.findOne({hash: req.params.hash}).exec(function(err, project) {
    if (project === null) {
      return next('project doesn\'t exist');
    }

    if (err) {
      return next(err);
    }

    res.json(project);
  });
});

router.delete('/projects/:hash', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    deleteReports: ['project', function(next, results){
      var project = results.project;

      Report.find({project: project._id}).remove(next);
    }],

    deleteFilters: ['project', function(next, results) {
      var project = results.project;

      Filter.find({project: project._id}).remove(next);
    }],

    deleteProject: ['project', function(next, results) {
      var project = results.project;

      Project.findById(project._id).remove(next);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(results);
  });
});

router.get('/projects/:hash/stats', function(req, res) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next)
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
