var express = require('express');
var route = express.Router();
var async = require('async');
var mongoose = require('mongoose');

var Project = mongoose.model('Project');
var Entry = mongoose.model('Entry');

route.post('/:hash', function(req, res) {
  var hash = req.params.hash;

  console.log("Body", req.body);

  async.auto({
    project: function(next) {
      Project.findOne({hash: hash}).exec(next)
    },

    entry: ['project', function(next, results) {
      var project = results.project;
      if (project == undefined)
        return next("Project doesn't exist.");
      var e = new Entry({
        ip: req.ip,
        project: project._id,
        raw: JSON.stringify(req.body),
        csp_report: req.body.csp_report
      })

      e.save(next);
    }]

  }, function(err, results) {
    if (err) {
      console.log("ERROR - ", err);
      res.send(err, 400);
      return
    }

    console.log(results);
    res.send('Okay');
  })
})

module.exports = route