var logger = require('../util/log4js').getLogger('kfwater');
var RedisService = require('../comp/redisService');
var Ap = require('../comp/app');
var config = require('../config/config');
var RESTART = 'keizak_knode_restart_' + config.appname;
var REDISKEY = config.redis_rcKey + ':normal';

function App() {

}

App.prototype.start = function() {
	var self = this;

	this._heartbeat();

	RedisService.on('pmessage', function(pattern, topic, message) {
		try {
			var rs = JSON.parse(message);
			if (topic == RESTART) {
				process.exit(0);
			}
		} catch (e) {
			logger.error('[Knode-F-Water Service] parse redis pmessage error', e);
		}
	});

	logger.info('[Knode-F-Water Service] kz-f-water service start');

	require('./initApp');
};

App.prototype._heartbeat = function() {
	var self = this;
	this.emitInfo('keizak_ksc_heartbeat', JSON.stringify({
		"appName": config.appname,
		"appStart": Ap.getStartTime(),
		"type": 2,
		"chost": config.cpath,
		"timeline": new Date().getTime()
	}));

	setTimeout(function() {
		self._heartbeat();
	}, 15000);
};

App.prototype.emitInfo = function(topic, data) {
	RedisService.exec(REDISKEY, function(err, redisClient) {
		if (err) {
			logger.error('[Knode-F-Water Service] exec redis publish error', err);
		} else {
			redisClient.publish(topic, data);
		}
	});
};

App.prototype.destroy = function() {
};

module.exports = new App();
