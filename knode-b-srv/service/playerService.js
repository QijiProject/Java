var logger = require('../util/log4js').getLogger('knbs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var MongoMgr = require('../comp/mongoService');
var DbMgr = require('../comp/dbService');
var GpMgr = require('../comp/gpService');

function Player() {
	EventEmitter.call(this);
}
util.inherits(Player, EventEmitter);

// get player bet gameplatform hall from player gp
Player.prototype.getPlayerGp = function(acpid, playername, callback) {
	if (!MongoMgr.getProxy()) {
		callback(1408, 981);
		return;
	}
	MongoMgr.getProxy().PlayerGpProxy.getPlayerGps(acpid, playername, function(err, docs) {
		if (err) {
			logger.error('get player gp error %s', String(err));
			callback(1408, 980);
		} else {
			var rs = [], item;
			for (var i = 0, len = docs.length; i < len; ++i) {
				item = docs[i];
				rs.push({gpid: item.gpid});
			}
			callback(0, rs);
		}
	});
};

Player.prototype.getPlayerGpById = function(acpid, playerid, callback) {
	if (!MongoMgr.getProxy()) {
		callback(1408, 981);
		return;
	}
	MongoMgr.getProxy().PlayerGpProxy.getPlayerGpsById(acpid, playerid, function(err, docs) {
		if (err) {
			logger.error('get player gp by id error %s', String(err));
			callback(1408, 980);
		} else {
			var rs = [], item;
			for (var i = 0, len = docs.length; i < len; ++i) {
				item = docs[i];
				rs.push({gpid: item.gpid});
			}
			callback(0, rs);
		}
	});
};

// 获取玩家参与投注的游戏平台大厅
Player.prototype.getGpHall = function(acpid, gpids, cb) {
	var self = this;
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('getGpHall error %s', String(err));
			DbMgr.closeConn(ctype, connection);
			cb(new Error('get gp hall error'), null);
		} else {
			connection.query('select gpid,gpname,gpaccountid from iplay_gameplatform where gpid in('+gpids+')', function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('mysql getconnection on %s getGpHall query %s', acpid, String(e));
					cb(new Error('get gp hall error-1'), null);
				} else {
					cb(null, rows);
				}
			});
		}
	});
};

Player.prototype.getMcBalance = function(o, cb) {
	var acpid = o.acinfo.acpid, uid = o.playerid, sql;
	sql = 'select (select balance from iplay_member_account where playerid='+uid+') as mainac,';
	sql += '(select ifnull(sum(amount),0) from iplay_withdraw_requisition where uid='+uid+' and utype=1 and status=0) as sumOfWithdrawamount';
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		var gpid = GpMgr.getKzac();
		if (err) {
			logger.error('getMcBalance error %s', String(err));
			DbMgr.closeConn(ctype, connection);
			cb(e, {gpid: gpid});
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('getMcBalance query error %s ', String(e));
					cb(e, {gpid: gpid});
				} else {
					cb(0, {gpid: gpid, val: {main: rows[0]['mainac'], withdraw: rows[0]['sumOfWithdrawamount']}});
				}
			});
		}
	});
};

Player.prototype.getPlayerTransferGps = function(o, cb) {
	var acpid = o.acinfo.acpid, uid = o.playerid, sql;
	sql = 'select a.gpid,b.gpname from iplay_member_gp a left join iplay_gameplatform_account b';
	sql += ' on a.gpid=b.gpid where a.playerid=' + uid + ' order by a.updated desc';
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('getPlayerTransferGps error %s', String(err));
			DbMgr.closeConn(ctype, connection);
			cb(e, null);
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('getPlayerTransferGps query error %s ', String(e));
					cb(e, null);
				} else {
					cb(0, rows || []);
				}
			});
		}
	});
};

Player.prototype.changePlayerAgent = function(o, cb) {
	var self = this, acpid = o.acinfo.acpid;
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('change player agent error %s', String(err));
			DbMgr.closeConn(ctype, connection);
			cb(1401, 'sql error');
		} else {
			connection.query('select * from iplay_member_changeagent where id=' + o.id + ' limit 1', function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('mysql getconnection on %s changePlayerAgent query %s', acpid, String(e));
					cb(1402, 'query error');
				} else {
					if (!rows || rows.length == 0) {
						cb(1403, 'invalid id');
					} else {
						var item = rows[0];
						if (item.status > 0) {
							cb(1404, 'processing');
						} else {
							self._changePlayerAgent(item, cb);
						}
					}
				}
			});
		}
	});
};

Player.prototype._changePlayerAgent = function(item, callback) {
	if (!MongoMgr.getProxy()) {
		callback(1408, 981);
		return;
	}
	var self = this;
	MongoMgr.getProxy().PlayerChangeAgentProxy.createChangeRecord(item, function(err, doc) {
		if (err) {
			logger.error('change player agent record error %s', String(err));
			callback(1408, 980);
		} else {
			if (doc.status > item.status) {
				self.updateChangePlayerAgentStatus(doc, callback);
			} else {
				callback(0, 0);
			}
		}
	});
};

Player.prototype.updateChangePlayerAgentStatus = function(o, cb) {
	var self = this;
	DbMgr.getConnection(o.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('update change player agent status error %s', String(err));
			DbMgr.closeConn(ctype, connection);
			cb(1401, 'sql error');
		} else {
			connection.query('update iplay_member_changeagent set status='+o.status+',updated=unix_timestamp() where id=' + o.id, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('mysql getconnection on %s updateChangePlayerAgentStatus query %s', o.acpid, String(e));
					cb(1402, 'query error');
				} else {
					cb(0, 0);
				}
			});
		}
	});
};

module.exports = new Player();
