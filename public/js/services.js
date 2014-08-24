var app = angular.module('app');

//Resources
app.factory('Project', function($resource) {
  return $resource('/api/projects/:id', {id: '@id'}, {update: {method: 'PUT'}, groups: {method: 'GET', url:'/api/projects/:id/groups', isArray: true}});
});

app.factory('Report', function($resource) {
  return $resource('/api/reports/:id', {id: '@id'}, {update: {method: 'PUT'}})
});

app.factory('Group', function($resource) {
  return $resource('/api/projects/:id/groups/:group', {id: '@id'}, {});
})

app.factory('Stats', function($resource) {
  return $resource('/api/projects/:id/stats', {id: '@id'}, {});
})

app.factory('Filter', function($resource) {
  return $resource('/api/filters/:id', {id: '@id'}, {update: {method: 'PUT'}, get: {method: 'GET', url: '/api/projects/:project/filters/:filter'}, query: {method: 'GET', isArray: true, url: '/api/projects/:project/filters'}});
})

app.service('GraphService', function() {
  out = {}

// sin.push({x: i, y: Math.sin(i/10)});
// {
// values: sin,      //values - represents the array of {x,y} data points
// key: 'Sine Wave', //key  - the name of the series.
// color: '#ff7f0e'  //color - optional: choose your own line color.
// },

  out.displayName = function(line) {
    if (line == undefined)
      return "undefined"

    if (line.length < 50) {
      return line;
    }

    return line.substring(0, 47) + '...';
  }

  out.buildSeries = function(groups, count, startDate, endDate, bucket) {
    if (groups == undefined || groups.length == 0)
      return;

    if (count <= 0)
      count = 1
     

    var series = _.chain(groups).first(count).map(function(group) {
      return {
        key: out.displayName(group.name),
        values: out.zeroFill(group.data, startDate, endDate, bucket) //out.zeroFill(group.data, startDate, endDate, bucket),
      };
    }).value();

    console.log(series)

    return series;
  }

  // Takes [{x: date, y: count}]
  out.zeroFill = function(data, startDate, endDate, bucket) {
    return data;
  }

  out.cleanDate = function(d) {
    if (_.isDate(d)) {
      return d.getTime()/1000;
    } else  {
      return d/1000;
    }
  }

  out.buildOptions = function(range){
    return {
      "chart": {
        "type": "multiBarChart",
        "height": 450,
        "margin": {
          "top": 20,
          "right": 20,
          "bottom": 60,
          "left": 45
        },
        "clipEdge": true,
        "staggerLabels": true,
        "transitionDuration": 500,
        "stacked": true,
        "xAxis": {
          "axisLabel": "Time (ms)",
          "showMaxMin": false,
          tickFormat: function(d) { 
            if (range === "hour" || range == "")
              return moment(d).format('LT') 
            if (range == "day")
              return moment(d).format('LT')
            if (range == "week")
              return moment(d).format('ll');
            if (range == "month")
              return moment(d).format('ll');
          }
        },
        "yAxis": {
          "axisLabel": "Y Axis",
          "axisLabelDistance": 40
        }
      }
    }
  }

  return out;
})


app.service('QueryParams', function() {
  var allDirectiveOn = {default: true, script: true, style: true, img: true, font: true, connect: true, media: true, object: true };
  var allDirectiveOff = {default: false, script: false, style: false, img: false, font: false, connect: false, media: false, object: false };

  var out = {}
  out.seriesCount = 3;
  out.range = "";
  out.stateDate = new Date();
  out.endDate = new Date();
  out.bucketSize = "hour";
  out.bucket = 60 * 60; // hour in seconds
  out.limit = 50;
  out.directives = allDirectiveOn;
  out.filters = true;

  out.allOn = function() {
    out.directives = _.clone(allDirectiveOn);
  };

  out.allOff = function() {
    out.directives = _.clone(allDirectiveOff);
  };

  out.setRange = function(period) {
    out.range = period;
    out.endDate = new Date().getTime();
    out.startDate = moment().subtract(period, 1).toDate().getTime();
  }
  out.setRange('day');

  out.setBucket = function(bucketString) {
    if (bucketString === "second") {
      out.bucket = 1;
    } else if (bucketString === "minute") {
      out.bucket = 60;
    } else if (bucketString === "hour") {
      out.bucket = 60 * 60;
    } else if (bucketString === "day") {
      out.bucket = 60 * 60 * 24;
    }

    out.bucketSize = bucketString;
  }

  return out;
})