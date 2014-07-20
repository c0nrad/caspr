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
    $scope.entries = Entry.query({conditions: {'project': project._id}}, function(entries) {
      buildBlockedChart(entries)
      buildDocumentChart(entries)
      buildTimeSeriesChart(entries)
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

  $scope.blockedChartType = "pie"
  function buildBlockedChart(entries) {
    var blockedGroups = _.countBy(entries, function(entry) { 
      if (entry.csp_report != undefined && entry.csp_report.blocked_uri != undefined) {
        if (entry.csp_report.blocked_uri == "") 
          return entry.csp_report.document_uri;
        else 
          return entry.csp_report.blocked_uri;
      }
      return "Not Specified"
    }); 

    var blockedGroupKeys = _.keys(blockedGroups);
    var outData = []
    for (var i = 0; i < blockedGroupKeys.length; ++i) {
      var key = blockedGroupKeys[i];
      var count = blockedGroups[key]
      outData.push({x: key, y: [count]})
    }

    $scope.blockedData = {
      series: _.keys(blockedGroups),
      data : outData
    }
    $scope.blockedConfig = {
      "labels": true,
      "title": "Blocked URIs",
      "legend": {
        "display": true,
        "position": "right"
      }
    }  
  }

  $scope.documentChartType = "pie"
  function buildDocumentChart(entries) {
    var documentGroups = _.countBy(entries, function(entry) { 
      if (entry.csp_report != undefined && entry.csp_report.document_uri != undefined) {
        return entry.csp_report.document_uri;
      }
      return "Not Specified";

    });
    var documentGroupKeys = _.keys(documentGroups);
    var outData = []
    for (var i = 0; i < documentGroupKeys.length; ++i) {
      var key = documentGroupKeys[i];
      var count = documentGroups[key]
      outData.push({x: key, y: [count]})
    }

    $scope.documentData = {
      series: _.keys(documentGroups),
      data : outData
    }
    $scope.documentConfig = {
      "labels": true,
      "title": "Document URIs",
      "legend": {
        "display": true,
        "position": "right"
      }
    }  
  }
});
