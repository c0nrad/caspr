var app = angular.module('app');

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

app.factory('Filter', function($resource) {
  return $resource('/api/filters/:id', {id: '@id'}, {update: {method: 'PUT'}, query: {method: 'GET', isArray: true, url: '/api/projects/:project/filters'}});
})

app.factory('FilterService', function() {
  var out = {}

  out.blockedGroupReports = function(filter, groups) {
    var filteredGroups = [];
    
    for (var i = 0; i < groups.length; ++i) {
      if (out.isMatch(filter, groups[i])) {
        filteredGroups.push(groups[i]);
      }

    }
  	return filteredGroups;
  }

  out.isMatch = function(filter, group) {
    var report = group['csp_report'];
    var expression = filter.expression;
    var field = filter.field;

    if (expression[0] === "/" && expression[expression.length-1] === "/")
      expression = expression.substring(1, filter.expression.length - 1)

    if (field in report && report[field].match( RegExp(expression) )) {
      return true;
    }
    return false;
  }

  out.allowedGroups = function(filter, groups) {
    var filteredGroups = [];
    
    for (var i = 0; i < groups.length; ++i) {
      if (!out.isMatch(filter, groups[i])) {
        filteredGroups.push(groups[i]);
      }

    }
    return filteredGroups;
  }

  out.countReports = function(groups) {
    if (groups == undefined || groups.length == 0)
      return 0

    return _.reduce(groups, function(c, group) { return c + group.count }, 0)
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
  out.directives = allDirectiveOn

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