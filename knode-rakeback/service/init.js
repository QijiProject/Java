var logger = require('../util/log4js').getLogger('knrb');
var RedisService = require('../comp/redisService');
var Ap = require('../comp/app');
var config = require('../config/config');
var RakeBack = require('./rakeback');
var RESTART = 'keizak_knode_restart_' + config.appname;
var REDISKEY = config.redis_rcKey + ':normal';

function App() {
}

App.prototype.start = function() {
	var self = this;

	RedisService.on('pmessage', function(pattern, topic, message) {
		try {
			var rs = JSON.parse(message);
			if (topic == RESTART) {
				process.exit(0);
			}
		} catch (e) {
			logger.error('[Knode-rakeback Service] parse redis pmessage error', e);
		}
	});

	RakeBack.start(this);

	logger.info('[Knode-rakeback Service] rakeback service start');

	this._heartbeat();
};

App.prototype._heartbeat = function() {
	var self = this;
	this.emitInfo('keizak_ksc_heartbeat', JSON.stringify({
		"appName": config.appname,
		"appStart": Ap.getStartTime(),
		"chost": config.cpath,
		"type": 2,
		"timeline": new Date().getTime()
	}));

	setTimeout(function() {
		self._heartbeat();
	}, 15000);
};

App.prototype.emitInfo = function(topic, data) {
	RedisService.exec(REDISKEY, function(err, redisClient) {
		if (err) {
			logger.error('[Knode-rakeback Service] exec redis publish error', err);
		} else {
			redisClient.publish(topic, data);
		}
	});
};

App.prototype.destroy = function() {
};

module.exports = new App();

