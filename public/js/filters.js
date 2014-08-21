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