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
}]);

//Resources
app.factory('Project', function($resource) {
  return $resource('/api/projects/:id', {id: '@id'}, {update: {method: 'PUT'}});
});

app.factory('Entry', function($resource) {
  return $resource('/api/entries/:id', {id: '@id'}, {update: {method: 'PUT'}})
})

app.controller('HomeController', function() {});

app.controller('NavController', function($location) {
  $scope.isActive = function (viewLocation) { 
    return viewLocation === $location.path();
  };
}); 

app.controller('NewProjectController', function($scope, Project, $location) {
  $scope.project = new Project({name: ""});
  $scope.save = function() {
    $scope.project.$save(function(project) {
      $location.url("/p/" + project.hash)
    })
  }
});

app.controller('ProjectController', function($scope, Project, Entry, $routeParams) {
  $scope.project = Project.get({id: $routeParams.id}, function(project) {
    Entry.query({conditions: {'project': project._id}}, function(entries) {
      buildTimeSeriesChart(entries)

      for (var i = 0; i < entries.length; ++i) 
        entries[i].selected = false; 

      $scope.entries = entries;
    })
  });

  function buildTimeSeriesChart(entries) {
     
    var blockedGroups = _.groupBy(entries, function(entry) { 
      if (entry.csp_report != undefined && entry.csp_report.blocked_uri != undefined) {
        if (entry.csp_report.blocked_uri == "") 
          return entry.csp_report.document_uri;
        else 
          return entry.csp_report.blocked_uri;
      }
      return "Not Specified"
    });

    var palette = new Rickshaw.Color.Palette();

    var series = _.map(blockedGroups, function(entries, name) {
      console.log(name, entries);
      return {
        name: name,
        data: _.sortBy(_.map(entries, function(entry) { return {x: new Date(entry.ts).getTime()/1000, y: 1}}), function(a) {return a.x}) ,
        color: palette.color()
      }
    })


    var graph = new Rickshaw.Graph( {
      height: 540,
      element: document.querySelector("#tschart"),
      renderer: 'scatterplot',
      series: series
    });
     

    var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );
  
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
    graph.render();

     
  }


});
