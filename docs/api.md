# API

The API is restful and produces json.

## Project
Projects are the top level unit. You should have one project per website/csp policy.

```
{
	// The report endpoint
  "endpoint": "ff4546ba0f580e6eaa75b2b69bdd1a7fe7504d3ddaa4a8e377bfc8965681654e",

	// How to access the report
	"hash": "6297b74e2ace5b4b6fb9c9458f53914d442fd89008ef0ae3d6c24c2c1829b2af",

	// MongoDB key
	"_id": ObjectId("540b64b6828700884dc0e151"),

	// Can only be accessable if the hash is known
	"hidden": true,

	// last seen policy
  "policy": "",

	// date project was created
  "ts": ISODate("2014-09-06T19:47:02.732Z"),

	// name of the project
  "name": "asdasd",
}
```

### POST /api/projects
Creates and returns a new project. Note, if the project is hidden, this is the only time you'll be able to see the hash.

 - name: String, "New Project", name of your project
 - hidden: Boolean, true, only accessable if you know the project hash

### GET /api/projects
Returns a list of all projects

### GET /api/projects/:hash
Returns an individual projects

### DELETE /api/projects/:hash
Deletes a project, along with all associates reports and filters


## Report
Wrapper object around CSP report.
```
{
	// MongoDB ID of parent project
  "project": ObjectId("53fc9ccf7d49ae120f598f78"),

	// ip address of the HTTP post report
	"ip": "::ffff:127.0.0.1",

	// headers from the HTTP post report
	"headers": "{\"content-type\":\"application/csp-report\",\"host\":\"localhost:3000\",\"content-length\":\"139\",\"connection\":\"close\"}",

	// the raw/original report recieved
  "original": "{\"csp-report\":{\"document-uri\":\"https://twitter.com\",\"violated-directive\":\"style-src 'self' https://www.host.com:443\",\"blocked-uri\":\"self\"}}",

	// Sanitized report in string form
	"raw": "{\"document-uri\":\"https://twitter.com/\",\"violated-directive\":\"style-src 'self' https://www.host.com:443\",\"blocked-uri\":\"\"}",

	// the violated directive from the report
	"directive": "style-src",

	// type of report
  "classification": "inline-style",

	// a unique was to view the report (will be changed soon)
  "name": "style-src - inline-style - https://twitter.com/ - ",

	// Mongodb ID
  "_id": ObjectId("540b6f839fb885db53c9dce9"),

	// The actual report (saves all the fields it recieves)
  "csp-report": {
    "document-uri": "https://twitter.com/",
    "violated-directive": "style-src 'self' https://www.host.com:443",
    "blocked-uri": ""
  },

	// time stamp the report was recieved
  "ts": ISODate("2014-09-06T20:33:07.651Z"),
  "__v": 0
}
```


###	GET /api/projects/:hash/reports
Returns a json list of reports

- startDate: Date/Number, specify start range for reports
- endDate: Date/Number, specify end range for reports
- limit: limit the number of reports

### DELETE /api/projects/:hash/reports
Delete all reports belonging to the project


## Groups
Groups are collections of reports

```
{
	// The report structure that was aggregated on
_id: {
	document-uri: "http://caspr.io/#/p/e73f40cd722426dd6df4c81fb56285335747fa29728bc72bd07cbcf5c2829d21/analyze",
	referrer: "",
	violated-directive: "style-src 'self'",
	original-policy: "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; font-src 'self'; report-uri https://caspr.io/endpoint/example",
	blocked-uri: "",
	source-file: "http://caspr.io/bower_components/jquery/dist/jquery.min.js",
	line-number: 3,
	column-number: 16171,
	status-code: 200
},

// Number of reports in group
count: 16,

// An example report
csp-report: {
document-uri: "http://caspr.io/#/p/e73f40cd722426dd6df4c81fb56285335747fa29728bc72bd07cbcf5c2829d21/analyze",
referrer: "",
violated-directive: "style-src 'self'",
original-policy: "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; font-src 'self'; report-uri https://caspr.io/endpoint/example",
blocked-uri: "",
source-file: "http://caspr.io/bower_components/jquery/dist/jquery.min.js",
line-number: 3,
column-number: 16171,
status-code: 200
},

// An example report ID
reportId: "540a9647b4a18afe317c2dca",

// All the reports are put in time buckets to build histograms
data: [ { x: 1409950800000, y: 0 }, ... , { x: 1410037200000, y: 0 }, { x: 1410040800000, y: 0 } ],

// Last seen report in the group
latest: "2014-09-06T05:06:15.799Z",

// directive of the group
directive: "style-src",

// classification of the reports in the group
classification: "inline-style",

// An example name of a report in the group
name: "style-src - inline-style - http://caspr.io/#/p/e73f40cd722426dd6df4c81fb56285335747fa29728bc72bd07cbcf5c2829d21/analyze - "
}
```

### GET /api/projects/:hash/groups
Returns reports aggregated into buckets of similar reports. Report dates will also be bucketed into bins

- startDate: Date, yesterday, the date to start aggregating on
- endDate: Date, now, the date to stop aggregating on
- directives: ['default-src',...], only aggregate certain directives
- limit: Number, 50, number of groups to return
- bucket: Number, 60 * 60: Number of seconds to make each bucket
- filters: Boolean, false, apply each filter
- filterExclusion: Boolean, true, should filters block (true) or pass (false)
- seriesCount: Number, 0, how many groups should have bucket data

### GET /api/projects/:hash/groups/:report
Groups all reports related to a report

- bucket: Number, 60 * 60: Number of seconds to make each bucket
- startDate: Date, yesterday, the date to start aggregating on
- endDate: Date, now, the date to stop aggregating on


## Filter
A way to hide reports/groups from a project
```
{
	// Project the filter belongs to
  "project": ObjectId("53fc9ccf7d49ae120f598f78"),

	// MongoDB OD
  "_id": ObjectId("540b77cec53fa2935d306f42"),

	// Name of the filter, not really important
	"name": "Block the HTTPS protocol",

	// The regexp that will be used for blocking
  "expression": "/^https:/",

	// The field to check the regexp against
  "field": "blocked-uri",

	// Is the filter currently active
  "active": true,
}
```

### POST /api/projects/:hash/filters
Create a new filter for a specific project

- active: Boolean, true, is the filter active
- field: string, blocked-uri, the csp report field to match the regexp against
- expression: string, '/^httpz:/', the regexp to block against
- name: string, 'Block the HTTPZ protocol', give the filter a name

### PUT /api/projects/:hash/filters/:filter
Update an existing filter

- active: Boolean, true, is the filter active
- field: string, blocked-uri, the csp report field to match the regexp against
- expression: string, '/^httpz:/', the regexp to block against
- name: string, 'Block the HTTPZ protocol', give the filter a name

### DELETE /api/projects/:hash/filters/:filter
Delete an existing filter

### GET /api/projects/:hash/filter
Get all filters belonging to a project

### GET /api/projects/:hash/filter/:filter
Get a specific filter
