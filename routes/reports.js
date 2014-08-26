var express = require('express');
var router = express.Router();
var async = require('async');
var _ = require('underscore')

var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Report = mongoose.model('Report');

var baucis = require('baucis');

var ReportController = baucis.rest('Report');

// router.use('/', baucis());


router.get('/projects/:hash/reports', function(req, res, next) {

	// XXX: allow either req.params or req.query or req.body?
	req.query = _.defaults(req.query, {
    endDate: new Date(),
    startDate: new Date(0),
    limit: 1000,
  })

  var startDate = new Date( Number(req.query.startDate))
  var endDate = new Date( Number(req.query.endDate))
  var limit = Number(req.query.limit);
 
	async.auto({
		project: function(next) {
			Project.findOne({hash: req.params.hash}, next)
		},

		reports: ['project', function(next, results) {
			var project = results.project;
			Report.find({project: project._id, ts: {$gt: startDate, $lt: endDate}}).limit(limit).exec(next)
		}]
	}, function(err, results) {
		if (err) return next(err)

		res.send(results);
	})
})

router.delete('/projects/:hash/reports', function(req, res, next) {
  async.auto({
    project: function(next) {
      Project.findOne({hash: req.params.hash}, next)
    },

    clear: ['project', function(next, results) {
      var project = results.project;

      Report.find({project: project._id}).remove(next)
    }]
  }, function(err, results) {
    if (err) {
      return next(err)
    }

    res.send(results)
  })
})


module.exports = router;
