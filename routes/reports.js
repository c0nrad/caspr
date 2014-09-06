'use strict';

var express = require('express');
var router = express.Router();
var async = require('async');
var _ = require('underscore');

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

router.get('/projects/:hash/reports', function(req, res, next) {

	req.query = _.defaults(req.query, {
    endDate: new Date(),
    startDate: new Date(0),
    limit: 1000,
  });

  var startDate = new Date( Number(req.query.startDate));
  var endDate = new Date( Number(req.query.endDate));
  var limit = Number(req.query.limit);

	async.auto({
		project: function(next) {
			Project.findOne({hash: req.params.hash}, next);
		},

		reports: ['project', function(next, results) {
			var project = results.project;
			if (!project) {
				return next('not a valid project');
			}

			Report.find({project: project._id, ts: {$gt: startDate, $lt: endDate}}).limit(limit).exec(next);
		}]
	}, function(err, results) {
		if (err) {
			return next(err);
		}

		res.send(results);
	});
});

router.delete('/projects/:hash/reports', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next);
    },

    clear: ['project', function(next, results) {
      var project = results.project;

			if (!project) {
				return next('not a valid project');
			}

      Report.find({project: project._id}).remove(next);
    }]
  }, function(err) {
    if (err) {
      return next(err);
    }

    res.send('okay');
  });
});

module.exports = router;
