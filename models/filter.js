'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FilterSchema = new Schema({
	active: {type: Boolean, default: true },
	field: { type: String, default: 'blocked-uri' },
	expression: {type: String, default: '/^https/' },
	name: { type: String, default: 'Block HTTPS' },
	project: {type: Schema.Types.ObjectId, ref: 'Project' }
});

FilterSchema.index({ project: 1 });

module.exports = mongoose.model('Filter', FilterSchema);
