var log4js = require('log4js'),
    wrapLog4js = require('./util/log4js'), logger = null;

wrapLog4js.configure('./config/log4js_config.json', {});
logger = wrapLog4js.getLogger('knmo', __filename);

var App = require('./comp/app');
var ThriftServ = require('./comp/thriftService');

process.on('uncaughtException', function (err) {
	console.log('Node NOT Exiting...' + err);
    logger.error('uncaughtException %s', String(err));
});

App.init(function(a) {
	ThriftServ.start(a);
});

process.on('exit', function() {
	App.destroy();
	ThriftServ.destroy();
});
