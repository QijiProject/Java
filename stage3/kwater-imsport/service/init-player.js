var logger = require('../util/log4js').getLogger('wimsport');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var config = require('../config/config');
var MongoMgr = require('../comp/mongoService');
var moment = require('moment'), tz = require('moment-timezone'), TIMEZONE = 'Asia/Shanghai';

function Player() {
	EventEmitter.call(this);
	this.userMap = {}; // acpid_name - > record
	this.gpid = config.gpid;
	this.on('upGp', this._updatePlayerGp.bind(this));
}
util.inherits(Player, EventEmitter);

Player.prototype.initPlayerGp = function(callback) {
	if (callback) callback();
	return;
	var self = this;
	MongoMgr.getProxy() && MongoMgr.getProxy().PlayerGpProxy.getListByGp(this.gpid, function(err, list) {
		if (err) {
			logger.error('init gp %s player %s', self.gpid, String(err));
			return;
		}
		var user;
		for (var i = 0, len = list.length; i < len; ++i) {
			user = list[i];
			self.userMap[user.acpid + '_' + user.playername] = user;
		}
		if (callback) callback();
	});
};

// get player from player gp
Player.prototype.getPlayer = function(acpid, playername, callback) {
	var self = this, user = this.userMap[this._getUid(acpid, playername)];
	if (user) {
		callback(null, user);
		return;
	}
	if (!MongoMgr.getProxy()) {
		callback(true, null);
		return;
	}
	MongoMgr.getProxy().PlayerGpProxy.findByName(acpid, playername, function(err, u) {
		if (err || !u) {
			// isue not found in player gp, check player table
			self._getPlayer(acpid, playername, callback);
		} else {
			self._setUserMap(u); // update map
			callback(null, u);
		}
	});
};

Player.prototype._setUserMap = function(user) {
	this.userMap[this._getUid(user.acpid, user.playername)] = user;
};

Player.prototype.clearUserCache = function(rs) {
	if (rs.acpid && rs.username) {
		try {
			var key = this._getUid(rs.acpid, rs.username),
				o = this.userMap[key];
			if (o) {
				this.userMap[key] = undefined;
				delete this.userMap[key];
			}
		} catch (e) {
			logger.error('clear user cache %s %s %s', rs.acpid, rs.username, String(e));
		}
	}
};

Player.prototype._updatePlayerGp = function(user) {
	user.updated = moment().tz(TIMEZONE).unix();
	MongoMgr.getProxy() && MongoMgr.getProxy().PlayerGpProxy.updateGp(user, this.gpid, function(err, pg) {
		if (err) {
			logger.error('update gp player %s', String(err));
		}
	});
};

Player.prototype._getUid = function(acpid, playername) {
	return acpid + '_' + playername;
};

// get player from player
Player.prototype._getPlayer = function(acpid, playername, callback) {
	var self = this;
	MongoMgr.getProxy() && MongoMgr.getProxy().PlayerProxy.findByName(acpid, playername, function(err, u) {
		if (err || !u) {
			callback(true, null);
			return;
		}
		self._setUserMap(u); // udpate map
		callback(null, u);
		self.emit('upGp', u); // update player gp
	});
};

var player = new Player();

module.exports = player;
