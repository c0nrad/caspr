var logger = require('winston');

logger.setLevels({debug:0,info: 1,silly:2,warn: 3,error:4,});
logger.addColors({debug: 'green',info:  'cyan',silly: 'magenta',warn:  'yellow',error: 'red'});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'debug', colorize:true, timestamp : true });

//logger.handleExceptions(new logger.transports.File({ filename: './exceptions.log' }))

module.exports = logger