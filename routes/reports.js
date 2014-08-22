var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Project = mongoose.model('Project');

var baucis = require('baucis');

var ReportController = baucis.rest('Report');

//router.use('/', baucis());

module.exports = router;
