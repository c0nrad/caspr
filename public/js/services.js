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
  return $resource('/api/filters/:id', {id: '@id'}, {update: {method: 'PUT'}}, {query: {method: 'GET', isArray: true, url: '/api/project/:hash/filters'}});
})

app.factory('FilterService', function() {
  out = {}

  out.filterReports = function(filter, groups) {
  	console.log(filter, groups);
  	return groups;
  }

  return out;

})