var app = angular.module('app');

app.filter('directiveType', function() {
  return function(input, allowedDirectives) {
    if (input == undefined || input.length == 0)
      return;

    var out = []
    for (var i = 0; i < input.length; ++i) {
      var report = input[i];
      var directive = report.directive.split('-')[0]

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
  }
})

app.filter('reportAndCount', function() {
  return function(groups) {
    if (groups == undefined || groups.length == 0)
      return [];

    return _.map(groups, function(group) {
      var out = group.csp_report;
      out.count = group.count;
      return out;
    })
  }
})