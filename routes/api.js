var express = require('express');
var router = express.Router()
var baucis = require('baucis')

var ProjectController = baucis.rest('Project');
var EntryController = baucis.rest('Entry');

ProjectController.findBy('hash');

router.use('/', baucis())
module.exports = router;