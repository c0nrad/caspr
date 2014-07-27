var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: {type: String, default: "My Project"},
  hash: {type: String, default: "", unique: true},
  policy: {type: String, default: "", unique: true},
});
ProjectSchema.index({ hash: 1 }); // schema level

ProjectSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  var _this = this;
  require('crypto').randomBytes(32, function(ex, buf) {
    var hash = buf.toString('hex');
    _this.hash = hash;
    console.log('lol', hash);
    next()
  });
})

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project