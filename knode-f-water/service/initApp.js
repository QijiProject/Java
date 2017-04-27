var logger = require('../util/log4js').getLogger('kfwater');
var express = require('express'),
    config = require('../config/config'),
    path = require('path');
var auth = require('../middlewares/auth');
var app = express();
var routes = require('../routes');
var cookieParser = require('cookie-parser');
// var session = require('express-session')

app.set('env', 'production');

// all environments
app.set('port',  config.port); // process.env.PORT
app.use(require('body-parser').json());
app.use(cookieParser());
// app.use(session({
// 	resave: false,
// 	saveUninitialized: false,
//     secret: config.session_secret
// }));

app.use(auth.interceptor);
app.use(routes);
app.listen(app.get('port'), function() {
	require('./playerGpService').start();
	logger.info('Listening on port %d', app.get('port'));
});