var app = angular.module('app', ['ngResource', 'angularCharts', 'ui.router']);


app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('home', {
      url: "/",
      templateUrl: "views/partials/home.html"
    })

    .state('projects', {
      url: "/projects",
      templateUrl: "views/partials/projects.html",
      controller: 'ProjectsController'
    })

    .state('contact', {
      url: "/contact",
      templateUrl: "views/partials/contact.html",
    })

    .state('project', {
      abstract: true,
      url: "/p/:id",
      templateUrl: "views/partials/project.html",
      controller: 'ProjectController',
      resolve: {
        project: function(Project, $stateParams) {
          return Project.get({id: $stateParams.id})
        },

        stats: function(Stats, $stateParams) {
          return Stats.get({id: $stateParams.id})
        }
      }
    })

    .state('project.overview', {
      url: "",
      templateUrl: "views/partials/overview.html",
      controller: 'OverviewController',
    })

    .state('project.query', {
      url: "/query",
      templateUrl: "views/partials/query.html",
      controller: "QueryController"
    })

    .state('project.filters', {
      url: "/filters", 
      templateUrl: "views/partials/filters.html",
      controller: "FiltersController"
    })

    .state('project.graph', {
      url: "/graph",
      templateUrl: "views/partials/graph.html",
      controller: "GraphController"
    })

    .state('project.table', {
      url: "/table",
      templateUrl: "views/partials/table.html",
      controller: "TableController"
    })
  }).run(function($rootScope, $state) {
      $rootScope.$state = $state;
    });

app.controller('HomeController', function() {});

app.controller('NavController', function($location, $scope) {

}); 

app.controller('ProjectsController', function(Project, $scope, Stats) {
  Project.query(function(projects) {
    out = []
    for (var i = 0; i < projects.length; ++i) {
      var project = projects[i];
      project.stats = Stats.get({id: project._id})
      out.push(project);
    }
    $scope.projects = out
  });
});

app.controller('NewProjectController', function($scope, Project, $location) {
  $scope.project = new Project({name: ""});
  $scope.save = function() {
    $scope.project.$save(function(project) {
      $location.url("/p/" + project._id)
    })
  }
});

app.controller('OverviewController', function($scope, stats, project) {
  $scope.host = window.location.host;
  $scope.protocol = window.location.protocol;
})

app.controller('ProjectController', function($scope, $rootScope, $stateParams, project, stats, FilterService, Filter, Group, QueryParams) {
  $scope.project = project;
  $scope.stats = stats;
  $scope.groups = []
  $scope.filteredGroups = []
  $scope.reportCount = 0;
  $scope.groupCount = 0;
  $scope.filteredCount = 0;

  $rootScope.$on('loadGroups', function($event) {
    params = _.pick(QueryParams, "startDate", "endDate", "bucket", "limit", "directives");
    params.directives =  _.chain(params.directives).pairs().filter(function(a) {return a[1]; }).map(function(a) { return a[0]+"-src"}).value()
    params.id = $stateParams.id;

    Group.query(params, function(groups) {
      $scope.groups = groups
      //$scope.groups = results.groups;
      //$scope.reportCount = results.reportCount;
      //$scope.groupCount = results.groupCount;

      $rootScope.$emit('applyFilters');
    });
  })

  $rootScope.$on('loadFilters', function($event) {
    $scope.filters = Filter.query({project: $stateParams.id}, function() {
      $rootScope.$emit('applyFilters');
    })
  })

  $rootScope.$on('applyFilters', function($event) {
    var groups = $scope.groups;
    var filters = $scope.filters;
    $scope.filteredGroups = []

    if (groups == undefined || filters == undefined)
      return;

    if (groups.length == 0 || filters.length == 0)
      return;

    var finalGroups = _.clone(groups);
    for (var i = 0; i < filters.length; ++i){
      filters[i].groups = FilterService.blockedGroupReports(filters[i], groups);
      filters[i].count = FilterService.countReports(filters[i].groups);

     if (filters[i].exclude) {
        finalGroups = FilterService.allowedGroups(filters[i], finalGroups);
     }
    }

    $scope.finalGroups = finalGroups;
    $scope.finalReportCount = FilterService.countReports(finalGroups);
    $scope.filteredReportsCount = $scope.reportCount - $scope.finalReportCount;

    $scope.filters = filters;
  })
  
  $rootScope.$emit('loadGroups');
  $rootScope.$emit('loadFilters');

});

app.controller('QueryController', function($scope, QueryParams, $rootScope) {
  $scope.params = QueryParams;

  $scope.$watch('params', function(newVal, oldVal) {
    $rootScope.$emit('loadGroups');
  }, true);

})

app.controller('TableController', function($scope, QueryParams) {
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
})

app.controller('FiltersController', function($scope, $rootScope, Filter, FilterService, $stateParams) {

  function reloadFilters() {
    $rootScope.$emit('loadFilters');
  }

  $scope.addFilter = function() {
    $scope.filter.$save();
    $scope.filter = new Filter({ project: $stateParams.id, name: "Name", expression: "/expression/", field: "blocked-uri" });
    reloadFilters();
  }

  $scope.saveFilter = function(index) {
    $scope.filters[index].$update({id: $scope.filters[index]._id}, function() {
      reloadFilters();
    })
  }

  $scope.deleteFilter = function(index) {
    $scope.filters[index].$delete({id: $scope.filters[index]._id}, function() {
      reloadFilters();
    })
  }
  
  $scope.filter = new Filter({ project: $stateParams.id, name: "Name", expression: "/expression/", field: "blocked-uri" });

})

app.controller('AnalyticsController', function() {
  function buildAnalytics(reports) {
    var fieldsHist = {}

    for (var i = 0; i < reports.length; ++i) {
      var report = reports[i];
      var keys = _.keys(report.csp_report)
      for (var k = 0; k < keys.length; ++k) {
        var key = keys[k];
        if (key in fieldsHist)
          fieldsHist[key] += report.count;
        else
          fieldsHist[key] = report.count;
      }
    }
  }
})

app.controller('GraphController', function($scope) {
  $scope.seriesCount = 3;
  
  $scope.$watch('groups', function(newVal, oldVal) {
    if (newVal == undefined || newVal.length == 0) return;
    buildTimeSeriesChart(newVal, $scope.seriesCount);
  });

  $scope.$watch('seriesCount', function(newVal, oldVal) {
    if (newVal < 0) { $scope.seriesCount = 1; return; }
    if (newVal == oldVal) {return;}
    buildTimeSeriesChart($scope.groups, $scope.seriesCount);
  });

  buildTimeSeriesChart($scope.groups, $scope.seriesCount);

  function buildTimeSeriesChart(groups, seriesCount) {
    document.querySelector('#tschart').innerHTML = '';
    document.querySelector('#legend').innerHTML = '';
    document.querySelector('#y_axis').innerHTML = '';

    if (groups == undefined || groups.length == 0)
      return;

    if (seriesCount <= 0)
      seriesCount = 1
     
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