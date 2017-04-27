var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');
var TIMEZONE = 'Asia/Shanghai';
var moment = require('moment');
var tz = require('moment-timezone');
var BigNumber = require('bignumber.js'), ZERO = new BigNumber(0);

function GenGPData(Ptag) {
	EventEmitter.call(this);
	this.Ptag = Ptag;
	this.acpid = null;
	this.nowtask = null;
	this.mtask = null;
	
	this.calcGpMonthlyList = [];

	this.on('nextGpRr', this._calcGpRr.bind(this));
}
util.inherits(GenGPData, EventEmitter);

GenGPData.prototype.start = function(acpid, task, mtask) {
	var self = this;
	this.acpid = acpid;
	this.nowtask = task;
	this.mtask = mtask;
	this.calcGpMonthlyList = [];

	this.gpallapiwl = null;

	process.nextTick(function() {
		self.genAgentGpMonthly();
	});
};

GenGPData.prototype.genAgentGpMonthly = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s genAgentGpMonthly %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'select sum(bettotal) as bettotal,sum(efftotal) as efftotal,sum(validbettotal) as validbettotal from iplay_player_gp_monthly ';
			sql += 'where asmonth='+self.nowtask.asmonth+' and agentcode='+self.mtask.agentcode;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s genAgentGpMonthly query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			if (rows.length === 0) {
        				self._updateMTask(1);
        			} else {
        				var item = rows[0];
        				if (!item['bettotal']) {
        					self._updateMTask(1);
        					return;
        				}
        				self.gpallapiwl = new BigNumber(item['bettotal']).minus(new BigNumber(item['efftotal']));
        				process.nextTick(function() {
        					self._genAgentGpMonthly();
        				});
        			}
        		}
       		});
		}
	});
};

GenGPData.prototype._genAgentGpMonthly = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _genAgentGpMonthly %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'select asmonth,agentcode,gpid,count(distinct playerid) as betuc,sum(betcount) as betcount,';
			sql += 'sum(bettotal) as bettotal,sum(efftotal) as efftotal,sum(validbettotal) as validbettotal from iplay_player_gp_monthly ';
			sql += 'where asmonth='+self.nowtask.asmonth+' and agentcode='+self.mtask.agentcode+' group by gpid';
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _genAgentGpMonthly query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			if (rows.length === 0) {
        				self._updateMTask(1);
        			} else {
        				self.calcGpMonthlyList = rows;
        				process.nextTick(function() {
        					self._calcGpRr();
        				});
        			}
        		}
       		});
		}
	});
};

// 更新结算单状态为 0-待生成平台数据，1-生成代理各游戏平台数据完成
GenGPData.prototype._updateMTask = function(stat) {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _updateMTask %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var dt = moment().tz(TIMEZONE).unix();
			connection.query('update iplay_agent_monthly set status='+stat+',updated='+dt+' where asmonth=' + self.nowtask.asmonth + ' and agentcode=' + self.mtask.agentcode, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql get connection on %s _updateMTask query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			if (stat == 1) { // 开始生成结算数据
        				self._complete();
        			}
        		}
       		});
		}
	});
};

// 2-生成各游戏平台抽佣抽水
GenGPData.prototype._calcGpRr = function() {
	var rr = this.calcGpMonthlyList.shift(), self = this;
	if (rr) {
		try {
			this._calcRr(rr);
		} catch (e) {
			logger.error('_calcGpRr fail ' + this.acpid, e);
			this.Ptag.emit('nextMonthlyTask');
		}
	} else {
		process.nextTick(function() {
			self._updateMTask(1);
		});
	}
};

// 计算代理每个平台抽佣抽水
GenGPData.prototype._calcRr = function(rr) {
	var group = this.Ptag.getAgentRr(this.mtask.groupid) || {},
		keyrate = group[rr.gpid + '_1'], keyrb = group[rr.gpid + '_2'], rsrate, rsrb;

	// 公司输赢
	var apiwl = new BigNumber(rr.bettotal).minus(new BigNumber(rr.efftotal));
	rsrate = this._calcKeyRr(rr, keyrate, apiwl);
	rsrb = this._calcKeyRr(rr, keyrb, null);

	var self = this, dt = moment().tz(TIMEZONE).unix(), task = self.nowtask;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _calcRr %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'insert into iplay_agent_gp_monthly(asmonth,gpid,agentcode,bettotal,efftotal,validbettotal,betuc,betcount,';
			sql += 'apiwl,rakerate,rake,rakebackrate,rakeback,created,updated) values('+task.asmonth+','+rr.gpid+','+rr.agentcode;
			sql += ',' + rr.bettotal + ',' + rr.efftotal + ',' + rr.validbettotal + ',' + rr.betuc + ',' + rr.betcount + ',' + apiwl.toString();
			sql += ',' + rsrate.rate + ',' + rsrate.ramount + ',' + rsrb.rate + ',' + rsrb.ramount + ',' + dt + ',' + dt + ')';
			sql += ' on duplicate key update updated=' + dt + ',bettotal=' + rr.bettotal + ',efftotal=' + rr.efftotal + ',validbettotal=' + rr.validbettotal;
			sql += ',betuc=' + rr.betuc + ',betcount=' + rr.betcount + ',apiwl=' + apiwl.toString() + ',rakerate=' + rsrate.rate;
			sql += ',rake=' + rsrate.ramount + ',rakebackrate=' + rsrb.rate + ',rakeback=' + rsrb.ramount;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _calcRr query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			self.emit('nextGpRr');
        		}
       		});
		}
	});
};

// 计算抽佣抽水
GenGPData.prototype._calcKeyRr = function(rr, rate, apiwl) {
	var y = null, diff, limitamount, _rate = null, x, adw, israte = false, neg = false,
		isprate = false, rprate = false;
	if (apiwl == null) {
		israte = false;
		x = new BigNumber(rr.validbettotal);
	} else {
		israte = true;
		adw = apiwl.toString() * 1;
		if (adw > 0) {
			isprate = true;
			x = apiwl;
		} else if (adw == 0) {
			return {rate: '0', ramount: '0.00'};
		} else {
			x = ZERO;
			neg = true;
			// return {rate: '1', ramount: apiwl.toFixed(2).toString()};
		}
	}
	if (rate) {
		// console.log(rate)
		if (rate.stepped == 0) { // 不设返水阶梯
			_rate = new BigNumber(rate.rrate).dividedBy(100);
			if (israte && this.gpallapiwl.toString() * 1 < 0) _rate = new BigNumber(100).dividedBy(100);
			// console.log('xx = ' + _rate.toString())
		} else {
			var item;
			for (var i = 0; i < rate._flen; ++i) {
				item = rate._flist[i];
				limitamount = new BigNumber(item.amount);
				if (israte) {
					diff = this.gpallapiwl.minus(limitamount);
				} else {
					diff = x.minus(limitamount);
				}
				if (diff.toString() * 1 >= 0) {
					_rate = new BigNumber(item.rate).dividedBy(100);
					// console.log('yy = ' + _rate.toString())
					break;
				}
			}
		}
		if (israte && !_rate && isprate && this.gpallapiwl.toString() * 1 < 0) {
			rprate = true;
		}
		if ((neg || rprate) && !_rate) _rate = new BigNumber(100).dividedBy(100);
		// console.log('zz = ' + _rate.toString())
		if (_rate) {
			if (neg) {
				// console.log(123)
				y = apiwl.times(_rate);
				// console.log(y.toString())
			} else {
				y = x.times(_rate);
			}
		}
		if (y && rate.rrlimit > 0) {
			limitamount = new BigNumber(rate.rrlimit);
			diff = y.minus(limitamount);
			if (diff.toString() * 1 > 0) y = limitamount;
		}
	}
	return y == null ? {rate: '0', ramount: '0.00'} :
		 {rate: _rate.toString(), ramount: y.toFixed(2).toString()};
};

GenGPData.prototype._complete = function() {
	this.Ptag.emit('doGenMonthly', this.mtask);
	this._clear();
};

GenGPData.prototype._clear = function() {
	this.acpid = null;
	this.nowtask = null;
	this.mtask = null;
	this.calcGpMonthlyList = [];
};

module.exports = GenGPData;
