var reports = require('./twitter.json').reports;

var filters = [ {
    name: 'blocked-uri',
    expression: /^https/,
    type: ''
}]

for (var i = 0; i < filters.length; ++i) {
    var filter = filters[i];
    var name = filter.name;
    var expression = filter.expression;

    for (var r = 0; r < reports.length; ++r) {
        var report = reports[r]['csp-report'];
        if (report[name].match(expression)) {
            console.log('match', report[name]);
        }
    }
}





