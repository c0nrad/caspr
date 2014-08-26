var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var opts = require('nomnom');
var logger = require('../logger');

var opts = require('../options');

reportOptions = {}
if (opts.cappedCollectionSize != 0) {
  logger.info("Capping report collection at", opts.cappedCollectionSize)
  reportOptions['capped'] = opts.cappedCollectionSize;
}

// Sanitized Report ->
// Original Report

var ReportSchema = new Schema({
  project: {type: Schema.Types.ObjectId, ref: 'Project'},

  ts: {type: Date, default: Date.now},

  // Original Content
  ip: String,
  headers: String,
  original: String,

  //Sanitized reports
  raw: String,
  'csp-report': {
    'document-uri': String,
    'referrer': String,
    'blocked-uri': String,
    'violated-directive': String,
    'original-policy': String,
    'source-file': String,
    'line-number': Number,
    'column-number': Number,
    'status-code': Number,
    'effective-directive': String
  },

  // Guess work
  classification: String,
  directive: String,
  name: String,

}, reportOptions)

// XXX: lrn2index
ReportSchema.index({ project: 1 }); 
ReportSchema.index({ csp_report: 1 }); 
ReportSchema.index({ ts: 1 }); 
ReportSchema.index({ directive: 1 }); 

var Report = mongoose.model('Report', ReportSchema);

module.exports = Report;