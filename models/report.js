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

var ReportSchema = new Schema({
  project: {type: Schema.Types.ObjectId, ref: 'Project'},
  ts: {type: Date, default: Date.now},

  ip: String,
  headers: String,
  raw: String,
  directive: String,

  csp_report: {
    document_uri: String,
    referrer: String, 
    blocked_uri: String,
    violated_directive: String,
    original_policy: String,
    source_file: String,
    line_number: Number,
    column_number: Number,
    status_code: Number
  },
}, reportOptions)

// XXX: lrn2index
ReportSchema.index({ project: 1 }); 
ReportSchema.index({ csp_report: 1 }); 
ReportSchema.index({ ts: 1 }); 
ReportSchema.index({ directive: 1 }); 


var Report = mongoose.model('Report', ReportSchema);

module.exports = Report;