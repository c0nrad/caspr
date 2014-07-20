var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EntrySchema = new Schema({
  project: {type: Schema.Types.ObjectId, ref: 'Project'},
  ts: {type: Date, default: Date.now},

  ip: String,
  headers: String,
  raw: String,

  csp_report: {
    document_uri: String,
    referrer: String, 
    blocked_uri: String,
    violated_directive: String,
    original_policy: String 
  },
})

var Entry = mongoose.model('Entry', EntrySchema);

module.exports = Entry;