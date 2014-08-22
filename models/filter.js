var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FilterSchema = new Schema({
	active: {type: Boolean, default: true },
	field: { type: String, default: "blocked-uri" },
	expression: {type: String, default: "/^https/" },
	name: { type: String, default: "HTTPS" },

	project: {type: Schema.Types.ObjectId, ref: "Project" }
});

module.exports = mongoose.model('Filter', FilterSchema);