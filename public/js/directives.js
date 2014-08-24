var app = angular.module('app');

app.directive('graph', function() {
  return {
    restrict: 'EA',
    scope: {
      series: "=",
      count: "@"
    },
    templateUrl: 'views/partials/graphTemplate.html',

    link: function(scope, element, attrs) {

      scope.$watch('series', function(newVal, oldVal) {
        graph(newVal);
      })

      function graph() {
        document.querySelector('#tschart').innerHTML = '';
        document.querySelector('#legend').innerHTML = '';
        document.querySelector('#y_axis').innerHTML = '';
        
        var series = scope.series;
        if (series == undefined)
          return

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
    }
  }
});