'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var async = require('async');

var ProjectSchema = new Schema({
  name: {type: String, default: 'My Project'},
  ts: {type: Date, default: Date.now},
  policy: {type: String, default: ''},
  hash: {type: String},
  endpoint: {type: String},
  hidden: {type: Boolean, default: true}
});

ProjectSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next();
  }

  var _this = this;

  async.auto({
    setHash: function(next) {
      require('crypto').randomBytes(32, function(ex, buf) {
        var hash = buf.toString('hex');
        _this.hash = hash;
        next();
      });
    },

    setEndpoint: function(next) {
      require('crypto').randomBytes(32, function(ex, buf) {
        var hash = buf.toString('hex');
        _this.endpoint = hash;
        next();
      });
    }
  }, function(err){
    next(err);
  });
});

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
