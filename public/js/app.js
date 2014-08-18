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
  return $resource('/api/projects/:id', {id: '@id'}, {update: {method: 'PUT'}, groups: {method: 'GET', url:'/api/projects/:id/groups', isArray: true}});
});

app.factory('Report', function($resource) {
  return $resource('/api/reports/:id', {id: '@id'}, {update: {method: 'PUT'}})
});

app.factory('Group', function($resource) {
  return $resource('/api/projects/:id/groups', {id: '@id'}, {});
})

app.factory('Stats', function($resource) {
  return $resource('/api/projects/:id/stats', {id: '@id'}, {});
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

app.controller('ProjectController', function($scope, Project, Report, Group, $routeParams, Stats) {
  $scope.seriesCount = 3;
  $scope.host = window.location.host;
  $scope.range = "";

  $scope.startDate = new Date();
  $scope.endDate = new Date();
  $scope.bucketSize = "hour";
  $scope.bucket = 60 * 60; // hour in seconds
  $scope.limit = 50;

  var allDirectiveOn = {default: true, script: true, style: true, img: true, font: true, connect: true, media: true, object: true };
  var allDirectiveOff = {default: false, script: false, style: false, img: false, font: false, connect: false, media: false, object: false };

  $scope.setRange = function(period) {
    $scope.range = period;
    $scope.endDate = new Date().getTime();
    $scope.startDate = moment().subtract(period, 1).toDate().getTime();
    loadGroups();
  }

  $scope.setBucket = function(bucketString) {
    if (bucketString === "second") {
      $scope.bucket = 1;
    } else if (bucketString === "minute") {
      $scope.bucket = 60;
    } else if (bucketString === "hour") {
      $scope.bucket = 60 * 60;
    } else if (bucketString === "day") {
      $scope.bucket = 60 * 60 * 24;
    }

    $scope.bucketSize = bucketString;
    loadGroups();
  }

  $scope.allOn = function() {
    $scope.directive = _.clone(allDirectiveOn);
  };

  $scope.allOff = function() {
    $scope.directive = _.clone(allDirectiveOff);
  };

  $scope.allOn();

  $scope.$watch('directive', function(newVal, oldVal) {
    loadGroups();
  }, true)

  $scope.$watch('limit', function(newVal, oldVal) {
    loadGroups();
  })

  $scope.$watch('seriesCount', function(newVal, oldVal) {
    if (newVal === oldVal || oldVal === null || oldVal === undefined) {
      return;
    }

    if (newVal < 1) {
      $scope.seriesCount = 1;
    }

    buildTimeSeriesChart($scope.groups, $scope.seriesCount);
  });

  $scope.project = Project.get({id: $routeParams.id})

  function loadGroups() {
    var directives = _.chain($scope.directive).pairs().filter(function(a) {return a[1]; }).map(function(a) { return a[0]+"-src"}).value()
    Group.get({id: $routeParams.id, startDate: $scope.startDate, endDate: $scope.endDate, bucket: $scope.bucket, limit: $scope.limit, directives: directives}, function(results) {
      $scope.groups = results.groups;
      $scope.stats.reportCount = results.reportCount;
      $scope.stats.groupCount = results.groupCount;
      buildTimeSeriesChart(results.groups, $scope.seriesCount);
    });
  }
  $scope.setRange('day');

  $scope.stats = Stats.get({id: $routeParams.id});

  $scope.predicate = 'count';
  $scope.tableReversed = true;
  $scope.tableSort = function(predicate) {
    if ($scope.predicate === predicate) {
      $scope.tableReversed = ! $scope.tableReversed;
      return;
    }

    $scope.predicate = predicate;
  };

  $scope.urlDisplay = function(line) {
    if (line.length < 50) {
      return line;
    }

    return line.substring(0, 47) + '...';
  };


  function buildTimeSeriesChart(groups, seriesCount) {
    document.querySelector('#tschart').innerHTML = '';
    document.querySelector('#legend').innerHTML = '';
    document.querySelector('#y_axis').innerHTML = '';

    if (groups.length == 0)
      return;
     
    var palette = new Rickshaw.Color.Palette();

    var series = _.chain(groups).first(seriesCount).map(function(group) {
      return {
        name: group.name,
        data: group.data,
        color: palette.color()
      };
    }).value();

    Rickshaw.Series.zeroFill(series);

    // Start Real Graphing
    var graph = new Rickshaw.Graph( {
      height: 540,
      element: document.querySelector('#tschart'),
      renderer: 'bar',
      series: series
    });
    
    var x_axis = new Rickshaw.Graph.Axis.Time({
      graph: graph,
      timeFixture: new Rickshaw.Fixtures.Time.Local()
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

app.filter('stringify', function() {
  return function(obj) {
    return JSON.stringify(obj, null, 2);
  };
});