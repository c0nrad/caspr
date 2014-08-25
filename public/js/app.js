var app = angular.module('app', ['ngResource', 'ui.router', 'nvd3']);

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

    .state('new', {
      url: "/p/new", 
      templateUrl: "views/partials/newProject.html",
      controller: 'NewProjectController'
    })

    .state('contact', {
      url: "/contact",
      templateUrl: "views/partials/contact.html",
    })

    .state('project', {
      abstract: true,
      url: "/p/:hash",
      templateUrl: "views/partials/project.html",
      controller: 'ProjectController',
      resolve: {
        project: function(Project, $stateParams) {
          return Project.get({hash: $stateParams.hash})
        },

        stats: function(Stats, $stateParams) {
          return Stats.get({hash: $stateParams.hash})
        }
      }
    })

    .state('project.overview', {
      url: "",
      templateUrl: "views/partials/overview.html",
      controller: 'OverviewController',
    })

    .state('project.analyze', {
      url: "/analyze",
      views: {
        'table': {
          templateUrl: "views/partials/table.html",
          controller: "TableController"
        },
        'graph': {
          templateUrl: "views/partials/graph.html",
          controller: "GraphController"
        }, 
        'query': {
          templateUrl: "views/partials/query.html",
          controller: "QueryController"
        }
      }
    })

    .state('project.group', {
      url: "/group/:group",
      templateUrl: "views/partials/group.html",
      controller: 'GroupController',
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

    .state('project.filter', {
      url: "/filter/:filter",
      templateUrl: "views/partials/filter.html",
      controller: 'FilterController'
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
      console.log(project.hash);
      project.stats = Stats.get({hash: project.hash})
      out.push(project);
    }
    $scope.projects = out
  });
});

app.controller('NewProjectController', function($scope, Project, $location) {
  $scope.project = new Project({name: ""});
  $scope.save = function() {
    $scope.project.$save(function(project) {
      $location.url("/p/" + project.hash)
    })
  }
});

app.controller('OverviewController', function($scope, stats, project) {
  $scope.host = window.location.host;
  $scope.protocol = window.location.protocol;
})

app.controller('ProjectController', function($scope, $rootScope, $stateParams, project, stats, Filter, Group, QueryParams) {
  $scope.project = project;
  $scope.stats = stats;
  $scope.groups = []
  $scope.filteredGroups = []
  $scope.reportCount = 0;
  $scope.groupCount = 0;
  $scope.filteredCount = 0;

  $rootScope.$on('loadGroups', function($event) {
    params = _.pick(QueryParams, "startDate", "endDate", "bucket", "limit", "directives", "filters");
    params.directives =  _.chain(params.directives).pairs().filter(function(a) {return a[1]; }).map(function(a) { return a[0]+"-src"}).value()
    params.hash = $stateParams.hash;

    Group.query(params, function(groups) {
      $scope.groups = groups
    });
  })
});

app.controller('GroupController', function($scope, $stateParams, Group, QueryParams, GraphService) {
  $scope.group = Group.get({hash: $scope.project.hash, group: $stateParams.group, startDate: QueryParams.startDate, endDate: QueryParams.endDate, bucket: QueryParams.bucket}, function(group) {
    $scope.data = GraphService.buildSeries([group], QueryParams.seriesCount, QueryParams.startDate, QueryParams.endDate, QueryParams.bucket);
    $scope.options = GraphService.buildOptions(QueryParams.range)
  })
})

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

app.controller('FilterController', function(GraphService, $scope, $state, $stateParams, Filter, QueryParams) {

  function loadFilter() {
    Filter.get({hash: $scope.project.hash, filter: $stateParams.filter}, function(results) {
      $scope.filter = results.filter;
      $scope.filteredGroups = results.filteredGroups
      $scope.filter.count = _.reduce(results.filteredGroups, function(c, group) { return c + group.count }, 0)
    
      //$scope.data = GraphService.buildSeries($scope.filteredGroups, $scope.filteredGroups.length);
      //$scope.options = GraphService.buildSeries(QueryParams.range)
    })
  }
  loadFilter();

  $scope.saveFilter = function() {
    Filter.update({id: $scope.filter._id}, $scope.filter, function() {
      loadFilter();
    });
  }

  $scope.deleteFilter = function() {
    Filter.delete({id: $scope.filter._id}, function() {
      $state.go('project.filters')
    })
  }
})

app.controller('FiltersController', function($scope, $rootScope, Filter, $stateParams) {
  $scope.filters = Filter.query({hash: $stateParams.hash});

  function reloadFilters() {
    $scope.filters = Filter.query({hash: $stateParams.hash});
    $rootScope.$emit('loadGroups');
  }

  $scope.addFilter = function() {
    $scope.filter.$save();
    $scope.filter = new Filter({ project: $scope.project._id, name: "Name", expression: "/expression/", field: "blocked-uri" });
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
  $scope.filter = new Filter({ project: $scope.project._id, name: "Name", expression: "/expression/", field: "blocked-uri" });
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

app.controller('GraphController', function(GraphService, QueryParams, $scope, $rootScope) {
  
  $scope.$watch('groups', function(newVal, oldVal) {
    if (newVal == undefined || newVal.length == 0) return;
    $scope.data = GraphService.buildSeries(newVal, QueryParams.seriesCount, QueryParams.startDate, QueryParams.endDate, QueryParams.bucket);
    $scope.options = GraphService.buildOptions(QueryParams.range)
  });
  
});