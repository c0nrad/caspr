var CASPR_ENDPOINT = "ws://localhost:8080/l/123"
var CASPR_REPORT_URI = "http://localhost:8080/r/123"
var STARTER_POLICY = "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';"

var app = angular.module('app', []);

app.controller('HomeController', function($scope, Projects) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    $scope.origin = getOrigin(tabs[0].url);
    $scope.project = Projects.getProject($scope.origin);
    $scope.tabId = tabs[0].id;
    $scope.$apply();

    var reportSocket = new WebSocket(CASPR_ENDPOINT);
    reportSocket.onmessage = function (event) {
      var report = JSON.parse(event.data);
      $scope.project = Projects.addReport($scope.origin, report);
      $scope.$apply();
    }
  });

  $scope.saveProject = function() {
    Projects.saveProject($scope.origin, $scope.project);
  }

  $scope.reload = function() {
    chrome.tabs.reload($scope.tabId);
  }

  $scope.clear = function() {
    Projects.clearProject($scope.origin)
    $scope.project = Projects.getProject($scope.origin);
  }

  $scope.acceptReport = function(index) {
    $scope.project = Projects.acceptReport($scope.origin, $scope.project.reports[index])
    console.log("updated project", $scope.project);
  }

  chrome.webRequest.onHeadersReceived.addListener(
    function(details) {

      var out = [];

      if (details.type !== 'main_frame') {
        return;
      }

      var matches = details.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      var domain = matches && matches[1];

      if (domain === null) {
        return;
      }

      var project = Projects.getProject($scope.origin);
      var policyString = project.policy + ' report-uri ' + CASPR_REPORT_URI + ";"
      console.log(policyString);

      out.push({name: "content-security-policy", value: policyString});

      for (var i = 0; i < details.responseHeaders.length; ++i) {
        if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy' || details.responseHeaders[i].name.toLowerCase() === 'content-security-policy-report-only') {
          // ignore previous content-security-policy
          continue;
        }
        out.push(details.responseHeaders[i]);
      }

      return { responseHeaders: out };
    }, { urls: [ '<all_urls>']}, [ 'blocking', 'responseHeaders']);
});

app.factory('Projects', function() {
  var out = {}

  out.getProject = function(origin) {
    var project = JSON.parse(window.localStorage.getItem(origin) || '{}');
    if (Object.keys(project).length == 0) {
      project = {
        origin: origin,
        reports: [],
        policy: STARTER_POLICY,
        reportURI: CASPR_REPORT_URI
      }
    }
    return project
  }

  out.saveProject = function(origin, project) {
    localStorage.setItem(origin, JSON.stringify(project))
  }

  out.updatePolicy = function(origin, policy) {
    var project = out.getProject(origin)
    project.policy = policy
    out.saveProject(origin, project)
  }

  out.addReport = function(origin, report) {
    var project = out.getProject(origin)
    if (!IsKnownReport(report, project.reports)) {
      project.reports.push(report);
    }
    out.saveProject(origin, project);

    return project;
  }

  out.clearProject = function(origin) {
    localStorage.removeItem(origin);
  }

  out.acceptReport = function(origin, report) {
    var project = out.getProject(origin)
    var directives = ParseDirectives(project.policy); 
    directives[report['effective-directive']] += ' ' + getOrigin(report['blocked-uri']) 
    project.policy = DirectivesToString(directives);
    project.reports = RemoveReport(project.reports, report);
    out.saveProject(origin, project);

    return project
  }

  function RemoveReport(reports, report) {
    var out = []
    for (var i = 0; i < reports.length; i++) {
      if (IsReportsEqual(reports[i], report)) {
        continue
      } else {
        out.push(reports[i])
      }
    }
    return out
  }

  function ParseDirectives(policy) {
    var out = {};

    var directiveStrings = policy.split(';');
    for (var i = 0; i < directiveStrings.length; ++i) {
      var directive = directiveStrings[i].trim().toLowerCase();
      var tokens = directive.split(/\s+/);

      var name = tokens[0];
      if (!name) {
        continue;
      }

      var values = tokens.slice(1, tokens.length);
      out[name] = values.join(' ');
      console.log(name, values.join(' '))
    }
    return out;
  }

  function DirectivesToString(directives) {
    var out = '';
     for (var directive in directives) {
       if (directives[directive]) {
         out += directive + ' ' + directives[directive] + '; ';
       }
     }
     return out.trim();
  }

  function IsKnownReport(report, reports) {
    for (var i = 0; i < reports.length; i++) {
      if (IsReportsEqual(reports[i], report)) {
        return true
      }
    }
    return false
  }

  return out
});

function IsReportsEqual(r1, r2) {
  var Keys = ["document-uri", "referrer", "violated-directive", "effective-directive", /**"original-policy", **/"blocked-uri", "status-code"]
  for (var i = 0; i < Keys.length; i++) {
    if (r1[Keys[i]] != r2[Keys[i]]) {
      return false;
    }
  }
  return true;
}

function getOrigin(url) {
  var u = new URL(url)
  return buildOrigin(u)
}

function buildOrigin(parsedUrl) {
  return parsedUrl.protocol + "//" + parsedUrl.host
}
