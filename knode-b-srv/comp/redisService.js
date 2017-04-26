var logger = require('../util/log4js').getLogger('knbs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Nedis = require('./nedis');
var config = require('../config/config');

function RedisServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.rMap = {}; // key -> redis client
	this.clientKey = {}; // client -> name

	this.initDB = false;

	this.pullrb = false;

	this.on('check', this.checkRedis.bind(this));
}
util.inherits(RedisServ, EventEmitter);

RedisServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.clientKey[config.redis_rcKey] = ['normal', 'psub_all'];

	if (config.redis_hasrb) {
		this.clientKey[config.redis_rbKey] = ['normal'];
	}

	this.pull(config.redis_rcKey, true);
};

RedisServ.prototype.pull = function(rkey, isFirst) {
	this.thriftServ.emit('pulldata', null, config.thriftKey.dbs, 3, -1, 0, rkey, isFirst);	
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
	var names = this.clientKey[redisKey] || [], key, name, self = this;
	for (var i = 0, len = names.length; i < len; ++i) {
		name = names[i];
		key = redisKey + ':' + name;
		if (this.rMap[key]) continue;
		this._createClient(key, name, data);
	}

	if (config.redis_hasrb) {
		if (!this.pullrb) {
			this.pullrb = true;
			setTimeout(function() {
				self.pull(config.redis_rbKey, true);
			}, 1000);
		}
	}
};

RedisServ.prototype._createClient = function(key, name, data) {
	var self = this;
	this.rMap[key] = new Nedis(data, key, function(evn, redisClient, rkey, errcount, isOncreate) {
		if (evn == 'connected') {
			if (isOncreate && name.indexOf('psub_') == 0) { // psubscribe client
				try {
					redisClient.punsubscribe();
					redisClient.psubscribe('keizak_knode_*_' + config.appname);
					redisClient.on('pmessage', function(pattern, topic, message) {
						self.emit('pmessage', pattern, topic, message);
					});
				} catch (e) {
					logger.error('[Redis Service] redis client ' + key + ' psubscribe fail');
				}
			}
			var lkey = config.redis_hasrb ? config.redis_rbKey : config.redis_rcKey;
			if (isOncreate && !self.initDB && rkey.indexOf(lkey) != -1) {
				self.initDB = true;
				require('./acpService').start(self.thriftServ);
			}
		} else if (evn == 'error') {
			if (errcount >= 5) {
				var tmp = rkey.split(':');
				self.refresh(tmp[0], false);
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

module.exports = new RedisServ;
