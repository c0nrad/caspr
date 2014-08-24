var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Filter = mongoose.model('Filter');
var Project = mongoose.model('Project');

var async = require('async');

var baucis = require('baucis');
var FilterController = baucis.rest('Filter');

var util = require('./util');

router.get('/projects/:hash/filters', function(req, res, next) {

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next)
    },

    filters: ["project", function(next, results) {
      var project = results.project;
      Filter.find({project: project._id}).exec(next)
    }]
  }, function(err, results) {
    console.log(results);
    res.send(results.filters);
  });
})

router.get('/projects/:hash/filters/:filter', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next)
    },

    filter: function(next) {
      Filter.findById(req.params.filter, next)
    },

    filteredGroups: ["filter", "project", function(next, results) {
      var filter = results.filter;
      var project = results.project;

      return util.aggregateGroups(new Date(0), new Date(), util.allDirectives, 1000, project._id, [filter], false, next);
    }]

  }, function(err, results) {
    if (err) return next(err);
    res.send(results);
  })
})

router.use('/', baucis());

module.exports = router;