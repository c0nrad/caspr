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

exports.aggregateGroups = function(startDate, endDate, directives, limit, bucket, projectId, filters, next) {
  var queryMatch = [
    {
      $match: {
        project: projectId,
        ts: {$gt: startDate, $lt: endDate},
        directive: {$in: directives}
      }
    },
  ]
  var filterMatch = buildMatchFilters(filters);
  var group = [
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
    { $sort : { count: -1 } },
    { $limit: limit }
  ];

  var aggregation = _.reduce([queryMatch, filterMatch, group], function(a, b) { return a.concat(b)}, [])
  console.log(  JSON.stringify(aggregation, null, 4))
  Report.aggregate(aggregation).exec(next);
}

exports.filterGroups = function(filters, groups) {
  buildMatchFilters(filters);
  return groups;
}

var buildMatchFilters = exports.buildMatchFilters = function(filters) {
  var out = []
  for (var i = 0; i < filters.length; ++i) {
    var filter = filters[i];
    var expression = filter.expression;
    var field = 'csp-report.' + filter.field;
    if (expression[0] === "/" && expression[expression.length-1] === "/") {
      expression = expression.substring(1, filter.expression.length - 1) 
    }

    var exp1 = {}
    exp1[field] = {'$exists': false}
    var exp2 = {}
    exp2[field] = {'$not': RegExp(expression)}
    var match = {
      '$match': {
        '$or': [_.clone(exp1), _.clone(exp2)]
      }
    }

    var match = {
      '$match': exp2
    }
    out.push(match);
  }
  return out;
}

// export.applyFilters = function( ) {
//   var groups = $scope.groups;
//     var filters = $scope.filters;
//     $scope.filteredGroups = []

//     if (groups == undefined || filters == undefined)
//       return;

//     if (groups.length == 0 || filters.length == 0)
//       return;

//     var finalGroups = _.clone(groups);
//     for (var i = 0; i < filters.length; ++i){
//       filters[i].groups = FilterService.blockedGroupReports(filters[i], groups);
//       filters[i].count = FilterService.countReports(filters[i].groups);

//      if (filters[i].exclude) {
//         finalGroups = FilterService.allowedGroups(filters[i], finalGroups);
//      }
//     }

//     $scope.finalGroups = finalGroups;
//     $scope.finalReportCount = FilterService.countReports(finalGroups);
//     $scope.filteredReportsCount = $scope.reportCount - $scope.finalReportCount;

//     $scope.filters = filters;
//   })

// app.factory('FilterService', function() {
//   var out = {}

//   out.blockedGroupReports = function(filter, groups) {
//     var filteredGroups = [];
    
//     for (var i = 0; i < groups.length; ++i) {
//       if (out.isMatch(filter, groups[i])) {
//         filteredGroups.push(groups[i]);
//       }

//     }
//     return filteredGroups;
//   }

//   out.isMatch = function(filter, group) {
//     var report = group['csp-report'];
//     var expression = filter.expression;
//     var field = filter.field;

//     if (expression[0] === "/" && expression[expression.length-1] === "/")
//       expression = expression.substring(1, filter.expression.length - 1)

//     if (report[field] !== undefined && report[field] !== null && report[field].match( RegExp(expression) )) {
//       return true;
//     }
//     return false;
//   }

//   out.allowedGroups = function(filter, groups) {
//     var filteredGroups = [];
    
//     for (var i = 0; i < groups.length; ++i) {
//       if (!out.isMatch(filter, groups[i])) {
//         filteredGroups.push(groups[i]);
//       }

//     }
//     return filteredGroups;
//   }

//   out.countReports = function(groups) {
//     if (groups == undefined || groups.length == 0)
//       return 0

//     return _.reduce(groups, function(c, group) { return c + group.count }, 0)
//   }

//   return out;
// })


// }
