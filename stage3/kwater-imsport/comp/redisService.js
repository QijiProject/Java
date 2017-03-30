var logger = require('../util/log4js').getLogger('wimsport');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Nedis = require('./nedis');
var config = require('../config/config');

function RedisServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.rMap = {}; // key -> redis client
	this.clientKey = {}; // client -> name

	this.initGp = false;

	this.on('check', this.checkRedis.bind(this));
}
util.inherits(RedisServ, EventEmitter);

RedisServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.clientKey[config.redis_rcKey] = ['normal', 'psub_all'];

	// thriftServ.emit('pulldata', config.redis_rcKey, config.thriftKey.dbs, 3, true);	
	this.pull(config.redis_rcKey, true);
};

RedisServ.prototype.pull = function(rkey, isFirst) {
	this.thriftServ.emit('pulldata', rkey, config.thriftKey.dbs, 3, isFirst);	
};

RedisServ.prototype.refresh = function(rkey, isFirst) {
	var self = this;
	setTimeout(function() {
		self.pull(rkey, isFirst);
	}, 10000);
};

RedisServ.prototype.checkRedis = function(redisKey, data, isFirst) {
	if (data == null) {
		logger.error('[Redis Service] get redis config error');
		this.refresh(redisKey, isFirst);
		return;
	}
	if (isFirst) {
		this.initRedisClient(redisKey, data);
	} else {
		var names = this.clientKey[redisKey] || [], key;
		for (var i = 0, len = names.length; i < len; ++i) {
			key = redisKey + ':' + names[i];
			if (this.rMap[key]) this.rMap[key].check(data);
		}
	}
};

RedisServ.prototype.initRedisClient = function(redisKey, data) {
	var names = this.clientKey[redisKey] || [], key, name;
	for (var i = 0, len = names.length; i < len; ++i) {
		name = names[i];
		key = redisKey + ':' + name;
		if (this.rMap[key]) continue;
		this._createClient(key, name, data);
	}
};

RedisServ.prototype._createClient = function(key, name, data) {
	var self = this;
	this.rMap[key] = new Nedis(data, key, function(evn, redisClient, rkey, errcount, isOncreate) {
		if (evn == 'connected') {
			if (isOncreate && name.indexOf('psub_') == 0) { // psubscribe client
				try {
					redisClient.punsubscribe();
					redisClient.psubscribe('keizak_water_*_' + config.gpid);
					redisClient.on('pmessage', function(pattern, topic, message) {
						self.emit('pmessage', pattern, topic, message);
					});
				} catch (e) {
					logger.error('[Redis Service] redis client ' + key + ' psubscribe fail');
				}
			}
			if (isOncreate && !self.initGp && rkey.indexOf(config.redis_rcKey) != -1) {
				self.initGp = true;
				// require('../service/init').start()
				require('./gpService').start(self.thriftServ);
			}
		} else if (evn == 'error') {
			if (errcount >= 5) {
				// self.thriftServ.emit('pulldata', rkey, config.thriftKey.dbs, 3, false);
				self.refresh(rkey, false);
			}
		}
	});
	logger.info('[Redis Service] start redis client ' + key);
};

RedisServ.prototype.exec = function(redisKey, callback) {
	var redis = this.rMap[redisKey];
	if (redis && redis.isReady()) {
		callback(null, redis.getConn());
	} else {
		callback(new Error('redis has not ready yet'), null);
	}
};

RedisServ.prototype.destroy = function() {
    try {
    	for (var key in this.rMap) {
    		this.rMap[key].destroy();
    	}
    } catch (e) {
    }
};

var _redis = module.exports = exports = new RedisServ();
