var app = angular.module('app', ['ngRoute', 'ngResource', 'angularCharts']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
    .when('/', {
      templateUrl: 'views/partials/home.html',
      controller: 'HomeController'
    })

    .when('/p/new', {
      templateUrl: 'views/partials/newProject.html', 
      controller: 'NewProjectController'
    })

    .when('/p/:id', {
      templateUrl: 'views/partials/project.html', 
      controller: 'ProjectController'
    })

    .when('/projects', {
      templateUrl: 'views/partials/projects.html', 
      controller: 'ProjectsController'
    })

    .when('/contact', {
      templateUrl: "views/partials/contact.html", 
      controller: 'ContactController'
    })
}]);

//Resources
app.factory('Project', function($resource) {
  return $resource('/api/projects/:id', {id: '@id'}, {update: {method: 'PUT'}});
});

app.factory('Report', function($resource) {
  return $resource('/api/reports/:id', {id: '@id'}, {update: {method: 'PUT'}})
})

app.controller('HomeController', function() {});

app.controller('NavController', function($location, $scope) {
  $scope.isActive = function (viewLocation) { 
    return viewLocation === $location.path();
  };
}); 

app.controller('ProjectsController', function(Project, $scope) {
  $scope.projects = Project.query();
});

app.controller('NewProjectController', function($scope, Project, $location) {
  $scope.project = new Project({name: ""});
  $scope.save = function() {
    $scope.project.$save(function(project) {
      $location.url("/p/" + project.hash)
    })
  }
});

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

app.controller('ProjectController', function($scope, Project, Report, $routeParams, Stats) {
  $scope.seriesCount = 3
  $scope.host = window.location.host

  var allDirectiveOn = {default: true, script: true, style: true, img: true, font: true, connect: true, media: true, object: true }
  var allDirectiveOff = {default: false, script: false, style: false, img: false, font: false, connect: false, media: false, object: false }

  $scope.allOn = function() {
    $scope.directive = _.clone(allDirectiveOn);
  }

  $scope.allOff = function() {
    $scope.directive = _.clone(allDirectiveOff);
  }

  $scope.allOn();

  $scope.$watch('seriesCount', function(newVal, oldVal) {
    if (newVal == oldVal || oldVal == null || oldVal == undefined) 
      return

    if (newVal < 1)
      $scope.seriesCount = 1

    buildTimeSeriesChart($scope.reports, $scope.seriesCount);

  });

  $scope.project = Project.get({id: $routeParams.id}, function(project) {
    Report.query({conditions: {'project': project._id}}, function(reports) {
      $scope.reports = reports;

      $scope.reportsToday = Stats.todayReportCount(reports);
      $scope.totalReports = Stats.totalReportCount(reports);
      $scope.uniqueReportsToday = Stats.todayUniqueReports(reports);
      $scope.totalUniqueReports = Stats.totalUniqueReports(reports);

      buildTimeSeriesChart(reports, $scope.seriesCount)

      $scope.groups = Stats.getSortedTableGroups(reports);

    })
  });

  $scope.predicate = "latest";
  $scope.tableReversed = true;
  $scope.tableSort = function(predicate) {
    if ($scope.predicate == predicate) {
      $scope.tableReversed = ! $scope.tableReversed;
      return;
    }

    $scope.predicate = predicate
  }

  $scope.urlDisplay = function(line) {
    if (line.length < 50)
      return line; 

    return line.substring(0, 47) + "...";
  }

  function buildTimeSeriesChart(reports, seriesCount) {
    document.querySelector("#tschart").innerHTML = "";
    document.querySelector('#legend').innerHTML = "";
    document.querySelector('#y_axis').innerHTML = "";
     
    console.log('buildTimeSeriesChart', reports);
    var palette = new Rickshaw.Color.Palette();
    var groups = Stats.getTodaySeriesByHourGroups(reports, seriesCount);

        // Assign Colors
    var series = _.map(groups, function(data, name) {
      return {
        name: name,
        data: data,
        color: palette.color()
      }
    })

    if (series.length == 0) {
      series= [{name: "Empty", data: Stats.emptyTodayBuckets(), color: palette.color()}]
    }

    // Start Real Graphing
    var graph = new Rickshaw.Graph( {
      height: 540,
      element: document.querySelector("#tschart"),
      renderer: 'bar',
      series: series
    });
     
    var x_axis = new Rickshaw.Graph.Axis.Time( { 
      graph: graph,
    });
  
    var y_axis = new Rickshaw.Graph.Axis.Y( {
      graph: graph,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: document.getElementById('y_axis'),
    });

    var legend = new Rickshaw.Graph.Legend( {
      element: document.querySelector('#legend'),
      graph: graph
    });


    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
      graph: graph,
      legend: legend
    });

    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
      graph: graph,
      legend: legend
    });

    graph.render();
  }
});

app.factory('Stats', function(Report) {
  out = {}

  out.todayReports = function(reports) {
    var start = new Date();
    start.setHours(0,0,0,0);

    var out = [];

    for (var i = 0; i < reports.length; ++i) {
      if (new Date(reports[i].ts) > start) {
        out.push(reports[i]);
      }
    }
    return out;
  }

  out.todayReportCount = function(reports) {
    var start = new Date();
    start.setHours(0,0,0,0);

    var count = 0;

    for (var i = 0; i < reports.length; ++i) {
      if (new Date(reports[i].ts) > start) {
        count += 1;
      }
    }

    return count;
  }

  out.totalReportCount = function(reports) {
    return reports.length;
  }

  out.getGroups = function(reports) {
    return _.groupBy(reports, function(report) { 
      if (report.csp_report != undefined && report.csp_report.blocked_uri != undefined) {
        if (report.csp_report.blocked_uri == "") 
          return report.directive + " - " + report.csp_report.document_uri;
        else 
          return report.directive + " - " + report.csp_report.blocked_uri;
      }
    });
  }

  out.getSortedTableGroups = function(reports) {
    return _.chain(out.getGroups(reports))
      .pairs()
      .sortBy(function(i) { return -i[1]; })
      .map(function(entry) {
        var name = entry[0];
        var reports = entry[1];
        var out = angular.copy(reports[0]);
        out.latest = new Date(_.max(reports, function(r) { return new Date(r.ts); }).ts);
        out.count = reports.length;
        out.name = name;
        return out;
      })
      .value();
  }

  out.topGroups = function(groups, count) {
    return _.chain(groups)
    .pairs()
    .sortBy(function(i) { 
      return -i[1].length;
    })
    .first(count)
    .value()
  }

  out.emptyTodayBuckets = function() {
    var buckets = [];
    for (var hour = 0; hour < 24; ++hour) {
      var d = new Date();
      d.setHours(hour, 0, 0, 0);
      buckets[hour] = {x: d.getTime()/1000, y: 0};
    }
    return buckets;
  }

  out.getTodaySeriesByHourGroups = function(reports, totalGroups) {
    var todayReports = out.todayReports(reports);
    var groups = out.getGroups(todayReports);
    var topGroups = out.topGroups(groups, totalGroups);

    var results = {}
    for (var groupIndex = 0; groupIndex < topGroups.length; ++groupIndex) {
      var group = topGroups[groupIndex][0];
      var reports = topGroups[groupIndex][1];
    
      var buckets = [];
      for (var hour = 0; hour < 24; ++hour) {
        var d = new Date();
        d.setHours(hour, 0, 0, 0);
        buckets[hour] = {x: d.getTime()/1000, y: 0};
      }

      for (var reportIndex = 0; reportIndex < reports.length; ++reportIndex) {
        var report = reports[reportIndex];
        var reportDate = new Date(report.ts);
        buckets[reportDate.getHours()].y += 1;
      }

      results[group] = buckets;
    }
    return results;
    // document_uri_1: [hour0, hour1, hour2, hour3...]
    // document_uri_2: [hour0, hour1, hour2, hour3...]
  }

  out.todayUniqueReports = function(reports) {
    var todayReports = out.todayReports(reports);
    return _.size(out.getGroups(todayReports));
  }

  out.totalUniqueReports = function(reports) {
    return _.size(out.getGroups(reports));
  }

  return out;
});
