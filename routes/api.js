'use strict';

var express = require('express');
var router = express.Router();

var projectRoutes = require('./projects');
var reportRoutes = require('./reports');
var groupRoutes = require('./groups');
var filterRoutes = require('./filters');

router.use('/', projectRoutes);
router.use('/', reportRoutes);
router.use('/', groupRoutes);
router.use('/', filterRoutes);

module.exports = router;
