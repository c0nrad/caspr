var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/caspr');

var Project = require('./project');
var Entry = require('./entry');


// // Temp Data
// Entry.remove({}, function() {
//   Project.remove({}, function() {
//     p = new Project({
//       name: "Some Project", 
//       hash: "abc123"
//     })
//     p.save();

//     p = new Project({
//       name: "Sngglr CSP Policy", 
//       hash: "123abc"
//     });

//     p.save(function(err, project) {
//       console.log(project)
//       e = new Entry({
//         project: p._id,

//         csp_report: {
//           document_uri: "http://example.com/signup.html",
//           referrer: "",
//           blocked_uri: "http://example.com/css/style.css",
//           violated_directive: "style-src cdn.example.com",
//           original_policy: "default-src 'none'; style-src cdn.example.com; report-uri /_/csp-reports",
//         },

//       });

//       e.save()
//       e = new Entry({
//         project: p._id,

//         csp_report: {
//           document_uri: "http://example.com/signup.html",
//           referrer: "",
//           blocked_uri: "http://example.com/css/style.css",
//           violated_directive: "style-src cdn.example.com",
//           original_policy: "default-src 'none'; style-src cdn.example.com; report-uri /_/csp-reports",
//         },

//       });

//       e.save()
//       e = new Entry({
//         project: p._id,

//         csp_report: {
//           document_uri: "http://example.com/kewl.html",
//           referrer: "",
//           blocked_uri: "http://example.com/css/style333.css",
//           violated_directive: "style-src cdn.example.com",
//           original_policy: "default-src 'none'; style-src cdn.example.com; report-uri /_/csp-reports",
//         },

//       });

//       e.save()
//       e = new Entry({
//         project: p._id,

//         csp_report: {
//           document_uri: "http://example.com/login.html",
//           referrer: "",
//           blocked_uri: "http://example.com/css/style333.css",
//           violated_directive: "style-src cdn.example.com",
//           original_policy: "default-src 'none'; style-src cdn.example.com; report-uri /_/csp-reports",
//         },

//       });

//       e.save()
//     });
//   });
// });
