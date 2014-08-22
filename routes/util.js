var mongoose = require('mongoose');
var Report = mongoose.model('Report');

var _ = require('underscore');

exports.buckets = function(bucketSize, startDate, endDate, data) {
  var hist = {};
  hist[Math.round(startDate/1000)] = 0;
  hist[Math.round(endDate/1000)] = 0;
  for (var i = 0 ; i < data.length; ++i) {

    var reportDate = Math.round(data[i].getTime()/1000);
    reportDate -= (reportDate % bucketSize);
    if (hist[reportDate] === undefined) {
      hist[reportDate] = 0;
    }
    hist[reportDate] += 1;
  }

  var keys = _.keys(hist);
  var out = [];
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];
    out.push({x: Number(key), y: hist[key] });
  }

  out = _.sortBy(out, function(a) {return a.x})

  return out;
}

exports.aggregateGroups = function(startDate, endDate, directives, limit, bucket, projectId, next) {
  Report.aggregate([
    {
      $match: {
        project: projectId,
        ts: {$gt: startDate, $lt: endDate},
        directive: {$in: directives}
      }
    },

    {
      $group: {
        _id: "$csp-report",
        count: {$sum: 1},
        'csp-report': {$last: "$csp-report"},
        data: { $push: "$ts" },
        latest: { $max: "$ts" },
        directive: {$last: "$directive" },
        classification: {$last: "$classification" },
        name: {$last: "$name" },

      } 
    },

    {
      $project: {
        count: 1,
        'csp-report': 1,
        data: 1,
        latest: 1,
        directive: 1,
        classification: 1,
        name: 1
      }
    },

    {
      $sort : {
        count: -1
      }

    },

    {
      $limit: limit
    }
  ]).exec(next);
}
