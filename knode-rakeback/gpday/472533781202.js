var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knrb');
var DbMgr = require('../comp/dbService');
var TIMEZONE = 'Asia/Shanghai';
var BigNumber = require('bignumber.js');
var moment = require('moment');
var tz = require('moment-timezone');
var PAGESIZE = 300, INTDATE_PATTERN = 'YYYYMMDD', SDATE_PATTERN = 'YYYY-MM-DD';

function PtRegular() {
	EventEmitter.call(this);
	this.task = null;
	this.ptag = null;

	this.daysum = [];
	this.groupMap = null;
	this.playerMap = null;

	this.calcStartIdx = 0;
	this.calcPage = 1;

	this.on('nextAcpGpid', this._nextAcpGpid.bind(this));

	this.on('completeTask', this._completeTask.bind(this));

	this.on('nextRb', this._genRb.bind(this));
}
util.inherits(PtRegular, EventEmitter);

PtRegular.prototype.start = function(ptag) {
	this.ptag = ptag;
};

PtRegular.prototype.digestTask = function(task) {
	var self = this;
	this.task = task;
	process.nextTick(function() {
		if (self.task.status == 1) {
			self._calcRakeback();
		} else {
			self.waterDayStatistic();
		}
	});
};

PtRegular.prototype.getDate = function() {
	if (!this.task._intdate) {
		var mo = moment(this.task.rkdate * 1000).subtract(1, 'days');
		mo = mo.tz(TIMEZONE);
		this.task._intdate = mo.format(INTDATE_PATTERN);
		this.task._sdate = new Date(mo.format(SDATE_PATTERN) + ' 23:59:59').getTime() / 1000;
	}
};

PtRegular.prototype.getIntDate = function(dt) {
	return moment(dt * 1000).tz(TIMEZONE).format(INTDATE_PATTERN);
};

// 取出流水
PtRegular.prototype.waterDayStatistic = function() {
	if (!this.task) return;
	var self = this;
	this.getDate();
	DbMgr.getConnection(this.task.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular doWaterDayStatistic %s', self.task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.beginTransaction(function(ex) {
				if (ex) {
					logger.error('mysql getconnection on %s NPtRegular doWaterDayStatistic action %s', self.task.acpid, String(ex));
					DbMgr.closeConn(ctype, connection);
					self.emit('nextAcpGpid');
				} else {
					var sql = 'insert into n1pt_regular_rktmp ('
				    sql += 'select wagersid,playerid,gamedate,realmoneybets+progressiveshare,realmoneywins from n1pt_regular_wagered where rrflag=0 and status=1 and gamedate<='+self.task._sdate + ')';
				    sql += ' on duplicate key update gamedate=values(gamedate),realmoneybets=values(realmoneybets),realmoneywins=values(realmoneywins)';
					connection.query(sql, function(e, result) {
						if (e) {
							connection.rollback(function() {
						        DbMgr.closeConn(ctype, connection);
								self.emit('nextAcpGpid');
						    });
						} else {
							var sql1 = 'update n1pt_regular_wagered set rrflag=1 where wagersid>0 and (gamedate,wagersid) in(select gamedate,wagersid from n1pt_regular_rktmp)';
							connection.query(sql1, function(e1, result) {
								if (e1) {
									connection.rollback(function() {
								        DbMgr.closeConn(ctype, connection);
										self.emit('nextAcpGpid');
								    });
								} else {
									connection.commit(function(e2) {
								        if (e2) { 
								        	connection.rollback(function() {
								            	DbMgr.closeConn(ctype, connection);
												self.emit('nextAcpGpid');
								        	});
								        } else {
								        	DbMgr.closeConn(ctype, connection);
											self._doStatistic();
								        }
								    });
								}
							});
						}
					});
				}
			});
		}
	});
};

// 日累加
PtRegular.prototype._doStatistic = function() {
	var self = this, task = this.task;
	DbMgr.getConnection(task.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _doStatistic %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.beginTransaction(function(ex) {
				if (ex) {
					logger.error('mysql getconnection on %s NPtRegular _doStatistic action %s', task.acpid, String(ex));
					DbMgr.closeConn(ctype, connection);
					self.emit('nextAcpGpid');
				} else {
					var dt = moment().tz(TIMEZONE).unix();
					var sql = 'insert into iplay_member_daysum(sid,playerid,gpid,sday,bettotal,efftotal,betc,';
					sql += 'created,updated,status) (select '+task.sid+',playerid,'+task.gpid+',' + task._intdate + ',sum(realmoneybets),sum(realmoneywins),count(*),' + dt + ',' + dt + ',1 from n1pt_regular_rktmp group by playerid)';
					sql += ' on duplicate key update bettotal=bettotal+values(bettotal),efftotal=efftotal+values(efftotal),betc=betc+values(betc),updated=' + dt;
					connection.query(sql, function(e, result) {
						if (e) {
							connection.rollback(function() {
						        DbMgr.closeConn(ctype, connection);
								self.emit('nextAcpGpid');
						    });
						} else {
							connection.query('delete from n1pt_regular_rktmp where wagersid>0', function(e1, result) {
								if (e1) {
									connection.rollback(function() {
								        DbMgr.closeConn(ctype, connection);
										self.emit('nextAcpGpid');
								    });
								} else {
									connection.commit(function(e2) {
								        if (e2) { 
								        	connection.rollback(function() {
								            	DbMgr.closeConn(ctype, connection);
												self.emit('nextAcpGpid');
								        	});
								        } else {
								        	DbMgr.closeConn(ctype, connection);
								        	setTimeout(function() {
								        		self._updateSettle();
								        	}, 10);
								        }
								    });
								}
							});
						}
					});
				}
			});
		}
	});
};

PtRegular.prototype._updateSettle = function() {
	var self = this, task = this.task;
	DbMgr.getConnection(task.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _updateSettle %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.query('update iplay_member_settlements set status=1,updated=unix_timestamp() where status=0 and sid='+task.sid+' and gpid=' + task.gpid, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _updateSettle query %s', task.acpid, String(e));
        			self.emit('nextAcpGpid');
        		} else {
        			process.nextTick(function() {
        				self._calcRakeback();
        			});
        		}
       		});
		}
	});
};

PtRegular.prototype._calcRakeback = function() {
	var self = this;
	DbMgr.getConnection(this.task.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _calcRakeback %s', self.task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			self.calcStartIdx = (self.calcPage - 1) * PAGESIZE;
			connection.query('select sid,playerid,gpid,sday,bettotal,efftotal,betc from iplay_member_daysum where status=1 and sid<='+self.task.sid+' and gpid='+self.task.gpid+' order by created asc limit ' + self.calcStartIdx + ',' + PAGESIZE, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _calcRakeback query %s', self.task.acpid, String(e));
        			self.emit('nextAcpGpid');
        		} else {
        			if (!rows || rows.length == 0) {
        				self.emit('completeTask');
        			} else {
        				self.daysum = rows;
        				self.calcPage++;
        				process.nextTick(function() {
        					if (!self.groupMap) {
        						self._getPlayerRR();
        					} else {
        						self._genRb();
        					}
        				});
        			}
        		}
       		});
		}
	});
};

PtRegular.prototype._genRb = function() {
	var wsum = this.daysum.shift(), self = this;
	if (wsum) {
		this._doRb(wsum);
	} else {
		process.nextTick(function() {
			self._calcRakeback();
		});
	}
};

PtRegular.prototype._doRb = function(wsum) {
	if (this.playerMap && this.playerMap[wsum.playerid]) {
		var rs = this._calcRate(this.playerMap[wsum.playerid], wsum);
		if (rs == null) {
			rs = {rate: '0', ramount: '0.00'};
			// this.emit('nextRb');
			// return;
		}
		this._rakebackInsert(rs, wsum);
	} else {
		this._getPlayerGroupId(wsum);
	}
};

// 计算返水比例和预计返水额
PtRegular.prototype._calcRate = function(groupid, wsum) {
	var group = this.groupMap[groupid];
	if (!group || group.rrperiod == 1) { // 不返水
		// this.emit('nextRb');
		return null;
	}
	var rate = group.rrate, y = null, diff, limitamount, _rate = null, bettotal;
	bettotal = new BigNumber(wsum.bettotal);
	if (group.stepped == 0) { // 不设返水阶梯
		_rate = new BigNumber(rate).dividedBy(100);
	} else {
		var item;
		for (var i = 0; i < group._flen; ++i) {
			item = group._flist[i];
			limitamount = new BigNumber(item.amount);
			diff = bettotal.minus(limitamount);
			if (diff.toString() * 1 >= 0) {
				_rate = new BigNumber(item.rate).dividedBy(100);
				break;
			}
		}
	}
	if (_rate/* && (_rate.toString() * 1 > 0)*/) y = bettotal.times(_rate);
	if (y && group.rrlimit > 0) {
		limitamount = new BigNumber(group.rrlimit);
		diff = y.minus(limitamount);
		if (diff.toString() * 1 > 0) y = limitamount;
	}
	return y == null ? null : {rate: _rate.toString(), ramount: y.toFixed(2).toString()};
};

// 添加返水审核记录
PtRegular.prototype._rakebackInsert = function(rs, wsum) {
	var self = this, task = this.task, dt = moment().tz(TIMEZONE).unix();
	DbMgr.getConnection(task.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _rakebackInsert %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextRb');
		} else {
			var sql = 'insert into iplay_member_rakeback(sid,playerid,gpid,rkdate,betcount,bettotal,';
			sql += 'efftotal,rrate,ramount,created,updated) values('+wsum.sid+','+wsum.playerid+','+task.gpid;
			sql += ',' + wsum.sday + ',' + wsum.betc + ',' + wsum.bettotal + ',' + wsum.efftotal;
			sql += ',' + rs.rate + ',' + rs.ramount + ',' + dt + ',' + dt + ') on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),rrate=values(rrate),ramount=values(ramount),updated=' + dt;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _rakebackInsert query %s', task.acpid, String(e));
        			self.emit('nextRb');
        		} else {
        			self._updateSumStat(dt, wsum);
        		}
       		});
		}
	});
};

// 更新日结记录状态
PtRegular.prototype._updateSumStat = function(dt, wsum) {
	var self = this, task = this.task;
	DbMgr.getConnection(task.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _rakebackInsert %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextRb');
		} else {
			var sql = 'update iplay_member_daysum set status=2 where status=1 and sid=' + wsum.sid + ' and playerid=' + wsum.playerid + ' and gpid=' + task.gpid + ' and sday=' + wsum.sday;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		self.emit('nextRb');
       		});
		}
	});
};

PtRegular.prototype._getPlayerGroupId = function(wsum) {
	var self = this, task = this.task;
	DbMgr.getConnection(task.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _getPlayerGroupId %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.query('select groupid from iplay_member where playerid=' + wsum.playerid, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _getPlayerGroupId query %s', task.acpid, String(e));
        			self.emit('nextAcpGpid');
        		} else {
        			try {
	        			var groupid = rows[0]['groupid'];
	        			if (!self.playerMap) self.playerMap = {};
	        			if (!self.playerMap[wsum.playerid]) self.playerMap[wsum.playerid] = groupid;
	        			self._doRb(wsum);
	        		} catch (er) {
	        			logger.error('do rb on %s PtRegular _getPlayerGroupId query %s %s', task.acpid, wsum.playerid, String(er));
	        			self.emit('nextAcpGpid');
	        		}
        		}
       		});
		}
	});
};

// 玩家层级
PtRegular.prototype._getPlayerRR = function() {
	var self = this, task = this.task;
	self.groupMap = {};
	DbMgr.getConnection(task.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _getPlayerRR %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.query('select groupid,gpid,rrperiod,rrlimit,rrate,stepped,stepcond from iplay_mgroup_rr where gpid=' + task.gpid, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _getPlayerRR query %s', task.acpid, String(e));
        			self.emit('nextAcpGpid');
        		} else {
        			if (rows.length == 0) {
        				self.emit('completeTask');
        			} else {
        				self._mapGroup(rows);
        			}
        		}
       		});
		}
	});
};

PtRegular.prototype._mapGroup = function(rows) {
	var item, tmp, s, x, f, l;
	for (var i = 0, len = rows.length; i < len; ++i) {
		item = rows[i];
		if (!this.groupMap[item.groupid]) {
			if (item.stepped && item.stepcond.length) { // 阶梯式返水条件
				f = [];
				tmp = item.stepcond.split('||');
				l = tmp.length;
				item._flen = l;
				for (var j = 0; j < l; ++j) {
					x = tmp[j];
					s = x.split('|'); // amount | rate
					f.push({amount: s[0], rate: s[1]});
				}
				item._flist = f;
			}
			this.groupMap[item.groupid] = item;
		}
	}
	this._genRb();
};

PtRegular.prototype._completeTask = function() {
	var self = this, task = this.task;
	DbMgr.getConnection(task.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s NPtRegular _completeTask %s', task.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcpGpid');
		} else {
			connection.query('update iplay_member_settlements set status=2,updated=unix_timestamp() where status=1 and sid='+task.sid+' and gpid=' + task.gpid, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s NPtRegular _completeTask query %s', task.acpid, String(e));
        		}
        		self.emit('nextAcpGpid');
       		});
		}
	});
};

PtRegular.prototype._nextAcpGpid = function() {
	this.daysum = [];
	this.calcStartIdx = 0;
	this.calcPage = 1;
	this.groupMap = null;
	this.playerMap = null;
	this.ptag.emit('nextAcpGpid', this.task.acpid);
	this.task = null;
};

module.exports = PtRegular;
