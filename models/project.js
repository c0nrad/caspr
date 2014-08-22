var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: {type: String, default: "My Project"},
  ts: {type: Date, default: Date.now},
  policy: {type: String, default: ""},
});

ProjectSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  var _this = this;
  require('crypto').randomBytes(32, function(ex, buf) {
    var hash = buf.toString('hex');
    _this.hash = hash;
    next()
  });
})

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project