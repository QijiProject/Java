var logger = require('../util/log4js').getLogger('knbs');

function initApp() {

}

initApp.prototype.start = function() {
	var express = require('express'),
	    config = require('../config/config'),
	    path = require('path');
	var auth = require('../middlewares/auth');
	var app = express();
	var routes = require('../routes');
	var cookieParser = require('cookie-parser');

	app.set('env', 'production');

	// all environments
	app.set('port',  config.port); // process.env.PORT
	app.use(require('body-parser').json());
	app.use(cookieParser());

	app.use(auth.interceptor);
	app.use(routes);
	app.listen(app.get('port'), function() {
		logger.info('Listening on port %d', app.get('port'));
	});
};

module.exports = new initApp;