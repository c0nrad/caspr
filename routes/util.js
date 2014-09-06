'use strict';

var mongoose = require('mongoose');
var Report = mongoose.model('Report');

var _ = require('underscore');

exports.allDirectives = ['default-src', 'script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'media-src', 'object-src']

exports.buckets = function(bucketSize, startDate, endDate, data) {
  var hist = {};
  startDate = Math.round(startDate / 1000);
  endDate = Math.round(endDate / 1000);
  bucketSize = Math.round(bucketSize);

  // So, round startDate up, and endDate down. So if day/hour, then only 24 groups with priority on new reports
  startDate -= (startDate % bucketSize) + bucketSize;
  endDate -= endDate % bucketSize;

  for (var d = startDate; d <= endDate; d += bucketSize) {
    hist[d] = 0;
  }

  for (var i = 0 ; i < data.length; ++i) {
    var reportDate = Math.round(data[i] / 1000);
    reportDate -= (reportDate % bucketSize);

    // Since we offset startDate and endDate, it's possible we'll ignore
    if (reportDate < startDate || reportDate > endDate) {
      continue;
    }

    if (hist[reportDate] === undefined) {
      console.log(reportDate, hist, startDate, endDate, data);
      console.error('THIS IS BAD');
    }
    hist[reportDate] += 1;
  }

  var keys = _.keys(hist);
  var out = [];
  for (var j = 0; j < keys.length; ++j) {
    var key = keys[j];
    out.push({x: Number(key)*1000, y: hist[key] });
  }


  out = _.sortBy(out, function(a) {return a.x; });

  return out;
};

exports.aggregateGroups = function(startDate, endDate, directives, limit, projectId, filters, filterExclusion, next) {
  var queryMatch = [
    {
      $match: {
        project: projectId,
        ts: {$gt: startDate, $lt: endDate},
        directive: {$in: directives}
      }
    },
  ];

  var filterMatch = buildMatchFilters(filters, filterExclusion);

  var group = [
    {
      $group: {
        _id: '$raw',
        count: {$sum: 1},
        'csp-report': {$last: '$csp-report'},
        reportId: {$last: '$_id'},
        data: { $push: '$ts' },
        latest: { $max: '$ts' },
        directive: {$last: '$directive' },
        classification: {$last: '$classification' },
        name: {$last: '$name' },
      }
    },
    { $sort : { count: -1 } },
    { $limit: limit }
  ];

  var aggregation = _.reduce([queryMatch, filterMatch, group], function(a, b) { return a.concat(b); }, []);
  Report.aggregate(aggregation).exec(next);
};

exports.filterGroups = function(filters, groups) {
  buildMatchFilters(filters);
  return groups;
};

var buildMatchFilters = exports.buildMatchFilters = function(filters, filterExclusion) {

  var out = [];
  for (var i = 0; i < filters.length; ++i) {
    var filter = filters[i];
    var expression = filter.expression;
    var field = 'csp-report.' + filter.field;
    if (expression[0] === '/' && expression[expression.length-1] === '/') {
      expression = expression.substring(1, filter.expression.length - 1);
    }

    var exp = {};
    if (filterExclusion) {
      exp[field] = { '$not': new RegExp(expression) };
    } else {
      exp[field] = new RegExp(expression);
    }

    var match = {
      '$match': exp
    };

    out.push(match);
  }
  return out;
};
