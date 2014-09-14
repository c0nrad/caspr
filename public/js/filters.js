'use strict';

var app = angular.module('app');

app.filter('directiveType', function() {
  return function(input, allowedDirectives) {
    if (!input) {
      return;
    }

    var out = []
    for (var i = 0; i < input.length; ++i) {
      var report = input[i];
      var directive = report.directive.split('-')[0];

      if (allowedDirectives[directive])
        out.push(report);
    }

    return out;
  };
});

app.filter('stringify', function() {
  return function(obj) {
    return JSON.stringify(obj, null, 2);
  };
});

app.filter('fromNow', function() {
  return function(date) {
    return moment(date).fromNow();
  };
});


app.filter('notInline', function() {
  return function(groups) {
    if (!groups) {
      return [];
    }

    groups = _.clone(groups);


    var out = [];
    for (var i = 0; i < groups.length; ++i) {
      var group = groups[i];
      if (!!group['csp-report']['blocked-uri']) {
        out.push(group);
      }
    }
    return out;
  };
});

app.filter('groupByInline', function() {
  return function(groups) {
    if (!groups) {
      return [];
    }

    groups = _.clone(groups);

    var out = [];
    for (var i = 0; i < groups.length; ++i) {
      var group = groups[i];
      if (!group['csp-report']['blocked-uri']) {
        out.push(group);
      }
    }
    return out;
  };
});

app.filter('groupByDirective', function() {
  return function(groups) {
    if (!groups) {
      return groups;
    }

    var out = _.clone(groups);
    return _.groupBy(out, function(g) { return g['directive']; });
  };
});

app.filter('groupByBlocked', function() {
  return function(groups) {
    if (!groups) {
      return groups;
    }

    var out = _.clone(groups);


    out = _.groupBy(out, function(g) { return g['csp-report']['blocked-uri'] });

    out = _.map(out, function(groupedGroups) {
      var group = groupedGroups[0];
      var sum = 0;
      for (var i = 0; i < groupedGroups.length; ++i) {
        sum += groupedGroups[i].count;
      }

      group.count = sum;
      return group;
    });

    return out;
  };
});

app.filter('reportAndCount', function() {
  return function(groups) {
    if (!groups || groups.length === 0) {
      return [];
    }

    return _.map(groups, function(group) {
      var out = group['csp-report'];
      out.count = group.count;
      return out;
    });
  };
});
