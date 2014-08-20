var logger = require('./logger');
var opts = require("nomnom")
.option('port', {
  abbr: 'p',
  default: 3000,
  help: 'Port to run http caspr'
})
.option('ssl', {
  flag: true,
  default: false,
  help: 'Run ssl on port 443'
})
.option('sslKeyFile', {
  default: "./bin/certs/key.pem",
  help: "SSL key file for ssl"
})
.option('sslCertFile', {
  default: "./bin/certs/cert.pem",
  help: "SSL certificate file for ssl"
})
.option('cappedCollectionSize', {
  default: 0, //gigabyte
  help: 'Size of report collection in bytes'
})
.parse();

logger.info(opts);
module.exports = opts;

