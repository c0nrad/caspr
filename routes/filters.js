'use strict';

var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Filter = mongoose.model('Filter');
var Project = mongoose.model('Project');

var async = require('async');
var _ = require('underscore');

var baucis = require('baucis');
var FilterController = baucis.rest('Filter');

var util = require('./util');

router.post('/projects/:hash/filters', function(req, res, next) {
  var filter = _.pick(req.query, 'active', 'field', 'expression', 'name');
  filter = _.defaults(filter, {
    active: true,
    field: 'blocked-uri',
    expression: '/^httpz:/',
    name: 'Block the HTTPZ protocol'
  });

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filter: ['project', function(next, results) {
      var project = results.project;

      if (!project) {
        return next('not a valid project');
      }

      filter.project = project._id;
      var f = new Filter(filter);
      f.save(next);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(results.filter[0]);
  });
});

router.put('/projects/:hash/filters/:filter', function(req, res, next) {
  var params = _.pick(req.body, 'active', 'field', 'expression', 'name');

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filter: ['project', function(next, results) {
      var project = results.project;
      if (!project) {
        return next('not a valid project');
      }

      Filter.findByIdAndUpdate(req.params.filter, {$set: params}, next);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(results.filter);
  });
});

router.delete('/projects/:hash/filters/:filter', function(req, res, next) {

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filter: ['project', function(next, results) {
      var project = results.project;
      if (!project) {
        return next('not a valid project');
      }

      Filter.findById(req.params.filter).remove(next);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send('okay');
  });
});


router.get('/projects/:hash/filters', function(req, res, next) {

  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filters: ['project', function(next, results) {
      var project = results.project;
      if (!project) {
        return next('not a valid project');
      }

      Filter.find({project: project._id}).exec(next);
    }]
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    res.send(results.filters);
  });
});

router.get('/projects/:hash/filters/:filter', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    filter: function(next) {
      Filter.findById(req.params.filter, next);
    },

    filteredGroups: ['filter', 'project', function(next, results) {
      var filter = results.filter;
      var project = results.project;

      if (!filter) {
        return next('not a valid filter');
      }

      if (!project) {
        return next('not a valid project');
      }

      return util.aggregateGroups(new Date(0), new Date(), util.allDirectives, 1000, project._id, [filter], false, next);
    }]

  }, function(err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});

module.exports = router;
