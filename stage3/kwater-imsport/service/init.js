var logger = require('../util/log4js').getLogger('wimsport');
var RedisService = require('../comp/redisService');
var Ap = require('../comp/app');
var ImSport = require('./ImSport');
var config = require('../config/config');
var PlayerMgr = require('./init-player');
var REGETCMD = 'keizak_water_reget_' + config.gpid, RESTART = 'keizak_water_restart_' + config.gpid,
	CLEARUSER = 'keizak_water_clearu_' + config.gpid;
var REDISKEY = config.redis_rcKey + ':normal';

function App() {

}

App.prototype.start = function(cb) {
	var self = this;

	PlayerMgr.initPlayerGp(function() {
		ImSport.start(self);
	});

	RedisService.on('pmessage', function(pattern, topic, message) {
		try {
			var rs = JSON.parse(message);
			if (topic == REGETCMD && rs) {
				process.nextTick(function() {
					ImSport.setManual(rs);
				});
			} else if (topic == RESTART) {
				process.exit(0);
			} else if (topic == CLEARUSER) {
				process.nextTick(function() {
					PlayerMgr.clearUserCache(rs);
				});
			}
		} catch (e) {
			logger.error('[ImSport Service] parse redis pmessage error', e);
		}
	});

	logger.info('[ImSport Service] ImSport service start');

	//this._heartbeat();
};

/**App.prototype._heartbeat = function() {
	var self = this;
	this.emitInfo('keizak_ksc_node_heartbeat', JSON.stringify({
		"gpid": config.gpid,
		"start": Ap.getStartTime(),
		"heartbeat": new Date().getTime()
	}));

	setTimeout(function() {
		self._heartbeat();
	}, 10000);
};**/

/**App.prototype.emitInfo = function(topic, data) {
	RedisService.exec(REDISKEY, function(err, redisClient) {
		if (err) {
			logger.error('[ImSport Service] exec redis publish error', err);
		} else {
			redisClient.publish(topic, data);
		}
	});
};**/

App.prototype.destroy = function() {
	try {
		ImSport.destroy();
	} catch (e) {
		logger.error('[ImSport Service] destroy error', e);
	}
};

module.exports = new App();
