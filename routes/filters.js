var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Filter = mongoose.model('Filter');
var Project = mongoose.model('Project');

var async = require('async');

var baucis = require('baucis');
var FilterController = baucis.rest('Filter');

router.get('/projects/:id/filters', function(req, res, next) {

  async.auto({
    project: function(next) {
      Project.findById(req.params.id, next)
    },

    filters: ["project", function(next, results) {
      var project = results.project;
      Filter.find({project: project._id}).exec(next)
    }]
  }, function(err, results) {
    console.log(err, results);
    res.send(results.filters);
  });
})

router.use('/', baucis());

module.exports = router;