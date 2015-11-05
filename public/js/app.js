'use strict';

var app = angular.module('app', ['ngResource', 'ui.router', 'nvd3']);

app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'views/partials/home.html'
    })

    .state('projects', {
      url: '/projects',
      templateUrl: 'views/partials/projects.html',
      controller: 'ProjectsController'
    })

    .state('new', {
      url: '/p/new',
      templateUrl: 'views/partials/newProject.html',
      controller: 'NewProjectController'
    })

    .state('contact', {
      url: '/contact',
      templateUrl: 'views/partials/contact.html',
    })

    .state('project', {
      abstract: true,
      url: '/p/:hash',
      templateUrl: 'views/partials/project.html',
      controller: 'ProjectController',
      resolve: {
        project: function(Project, $stateParams) {
          return Project.get({hash: $stateParams.hash});
        },

        stats: function(Stats, $stateParams) {
          return Stats.get({hash: $stateParams.hash});
        }
      }
    })

    .state('project.overview', {
      url: '',
      templateUrl: 'views/partials/overview.html',
      controller: 'OverviewController',
    })

    .state('project.analyze', {
      url: '/analyze',
      views: {
        'table': {
          templateUrl: 'views/partials/table.html',
          controller: 'TableController'
        },
        'graph': {
          templateUrl: 'views/partials/graph.html',
          controller: 'GraphController'
        },
        'query': {
          templateUrl: 'views/partials/query.html',
          controller: 'QueryController'
        }
      }
    })

    .state('project.builder', {
      url: '/builder',
      templateUrl: 'views/partials/builder.html',
      controller: 'BuilderController'
    })

    .state('project.inline', {
      url: '/inline',
      templateUrl: 'views/partials/inline.html',
      controller: 'InlineController'
    })

    .state('project.group', {
      url: '/group/:group',
      templateUrl: 'views/partials/group.html',
      controller: 'GroupController',
    })

    .state('project.query', {
      url: '/query',
      templateUrl: 'views/partials/query.html',
      controller: 'QueryController'
    })

    .state('project.filters', {
      url: '/filters',
      templateUrl: 'views/partials/filters.html',
      controller: 'FiltersController'
    })

    .state('project.filter', {
      url: '/filter/:filter',
      templateUrl: 'views/partials/filter.html',
      controller: 'FilterController'
    })

    .state('project.graph', {
      url: '/graph',
      templateUrl: 'views/partials/graph.html',
      controller: 'GraphController'
    })

    .state('project.table', {
      url: '/table',
      templateUrl: 'views/partials/table.html',
      controller: 'TableController'
    });
  }).run(function($rootScope, $state) {
  $rootScope.$state = $state;
});

app.controller('HomeController', function() {});

app.controller('NavController', function() {

});

app.controller('ProjectsController', function(Project, $scope, Stats) {
  Project.query(function(projects) {
    var out = [];
    for (var i = 0; i < projects.length; ++i) {
      var project = projects[i];
      project.stats = Stats.get({hash: project.hash});
      out.push(project);
    }
    $scope.projects = out;
  });
});

app.controller('NewProjectController', function($scope, Project, $location) {
  $scope.project = new Project({name: ''});
  $scope.save = function() {
    $scope.project.$save(function(project) {
      $location.url('/p/' + project.hash);
    });
  };
});

app.controller('OverviewController', function($scope, $state, $rootScope, stats, project, Project) {
  $scope.host = window.location.host;
  $scope.protocol = window.location.protocol;

  $scope.deleteReports = function() {
    Project.clear({hash: project.hash}, function() {
      $rootScope.$emit('loadProject');
    });
  };

  $scope.deleteProject = function() {
    Project.delete({hash: project.hash}, function() {
      $state.go('projects');
    });
  };
});

app.controller('ProjectController', function($scope, $rootScope, $stateParams, project, stats, Project, Filter, Group, Stats, QueryParams) {
  $scope.project = project;
  $scope.stats = stats;
  $scope.groups = [];
  $scope.filteredGroups = [];
  // $scope.reportCount = 0;
  // $scope.groupCount = 0;
  // $scope.filteredCount = 0;

  $rootScope.$on('loadProject', function() {
    $scope.project = Project.get({hash: $stateParams.hash});
    $scope.stats = Stats.get({hash: $stateParams.hash});
  });

  $rootScope.$on('loadGroups', function() {
    var params = _.pick(QueryParams, 'startDate', 'endDate', 'bucket', 'limit', 'directives', 'filters', 'seriesCount');
    params.directives =  _.chain(params.directives).pairs().filter(function(a) {return a[1]; }).map(function(a) { return a[0]+'-src'}).value()
    params.hash = $stateParams.hash;

    Group.query(params, function(groups) {
      $scope.groups = groups;
    });
  });
});

app.controller('BuilderController', function($scope, QueryParams, $rootScope, project) {
  QueryParams.seriesCount = 0;
  QueryParams.limit = 100;
  $rootScope.$emit('loadGroups');
  $rootScope.$emit('loadProject');

  $scope.$watch('groups', function(newGroups, oldGroups) {
    if (newGroups === oldGroups) {
      return;
    }

    var groups = _.clone(newGroups);
    var notInlineGroups = _.filter(groups, function(g) { return g.classification !== 'inline'; });
    var directiveGroups = _.groupBy(notInlineGroups, function(g) { return g.directive; });
    for ( var directive in directiveGroups) {
      var directiveGroup = directiveGroups[directive];

      var groupedDirectiveGroup = _.groupBy(directiveGroup, function(g) { return g['csp-report']['blocked-uri']; });
      directiveGroups[directive] = _.map(groupedDirectiveGroup, function(groupDirectiveGroup) {
        var count = _.reduce(groupDirectiveGroup, function(prev, curr) { return prev + curr.count; }, 0);
        var group = _.max(groupDirectiveGroup, function(g) { return new Date(g.latest); });
        group.count = count;
        return group;
      });
    }

    $scope.directiveGroups = directiveGroups;
  });

  $scope.policy = project.policy;
  $scope.newOrigins = [];

  $scope.toggleOrigin = function(directive, value) {
    var pair = {directive: directive, value: value};
    for (var i = 0; i < $scope.newOrigins.length; ++i) {
      var originPair = $scope.newOrigins[i];
      if (originPair.directive === pair.directive && originPair.value === pair.value) {
        $scope.newOrigins.splice(i, 1);
        buildPolicy();
        return;
      }
    }
    $scope.newOrigins.push(pair);
    buildPolicy();
  };

  function buildPolicy() {
    var start = project.policy;
    var policy = new Policy(start);
    for (var i = 0; i < $scope.newOrigins.length; ++i) {
      var pair = $scope.newOrigins[i];
      policy.add(pair.directive, pair.value);
    }
    $scope.policy = policy.toString();
  }
});

app.controller('InlineController', function($scope, QueryParams, $rootScope) {
  QueryParams.seriesCount = 0;
  QueryParams.limit = 100;
  $rootScope.$emit('loadGroups');
  $rootScope.$emit('loadProject');

  $scope.$watch('groups', function(newGroups) {
    var groups = _.clone(newGroups);
    var inlineGroups = _.filter(groups, function(g) { return g.classification === 'inline'; });
    var directiveGroups = _.groupBy(inlineGroups, function(g) { return g.directive; });
    $scope.directiveGroups = directiveGroups;
  });

});

app.controller('GroupController', function($scope, $stateParams, Group, QueryParams, GraphService) {
  $scope.group = Group.get({hash: $scope.project.hash, group: $stateParams.group, startDate: QueryParams.startDate, endDate: QueryParams.endDate, bucket: QueryParams.bucket}, function(group) {
    $scope.data = GraphService.buildSeries([group], QueryParams.seriesCount, QueryParams.startDate, QueryParams.endDate, QueryParams.bucket);
    $scope.options = GraphService.buildOptions(QueryParams.range);
  });
});

app.controller('QueryController', function($scope, QueryParams, $rootScope) {
  $scope.params = QueryParams;

  $scope.$watch('params', function() {
    $rootScope.$emit('loadGroups');
  }, true);
});

app.controller('TableController', function($scope) {
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
});

app.controller('FilterController', function(GraphService, $scope, $state, $stateParams, Filter, QueryParams, project) {

  function loadFilter() {
    Filter.get({hash: $scope.project.hash, id: $stateParams.filter}, function(results) {
      $scope.filter = results.filter;
      $scope.filteredGroups = results.filteredGroups;
      $scope.filter.count = _.reduce(results.filteredGroups, function(c, group) { return c + group.count }, 0)

      //$scope.data = GraphService.buildSeries($scope.filteredGroups, $scope.filteredGroups.length);
      //$scope.options = GraphService.buildSeries(QueryParams.range)
    });
  }
  loadFilter();

  $scope.saveFilter = function() {
    Filter.update({hash: project.hash, id: $scope.filter._id}, $scope.filter, function() {
      loadFilter();
    });
  };

  $scope.deleteFilter = function() {
    Filter.delete({hash: project.hash, id: $scope.filter._id}, function() {
      $state.go('project.filters');
    });
  };
});

app.controller('FiltersController', function($scope, $rootScope, Filter, $stateParams, project) {
  $scope.filters = Filter.query({hash: project.hash});

  function reloadFilters() {
    $scope.filters = Filter.query({hash: $stateParams.hash});
    $rootScope.$emit('loadGroups');
  }

  $scope.addFilter = function() {
    $scope.filter.$save();
    $scope.filter = new Filter({hash: project.hash, name: 'Name', expression: '/expression/', field: 'blocked-uri' });
    reloadFilters();
  };

  $scope.saveFilter = function(index) {
    $scope.filters[index].$update({hash: project.hash, id: $scope.filters[index]._id}, function() {
      reloadFilters();
    });
  };

  $scope.deleteFilter = function(index) {
    $scope.filters[index].$delete({hash: project.hash, id: $scope.filters[index]._id}, function() {
      reloadFilters();
    });
  };
  $scope.filter = new Filter({ hash: project.hash, name: 'Name', expression: '/expression/', field: 'blocked-uri' });
});

app.controller('GraphController', function(GraphService, QueryParams, $scope) {
  QueryParams.seriesCount = 6;

  $scope.$watch('groups', function(newVal) {
    if (newVal === undefined || newVal.length === 0) {
      return;
    }
    $scope.data = GraphService.buildSeries(newVal, QueryParams.seriesCount, QueryParams.startDate, QueryParams.endDate, QueryParams.bucket);
    $scope.options = GraphService.buildOptions(QueryParams.range);
  });

});
