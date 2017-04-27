var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');
var TIMEZONE = 'Asia/Shanghai';
var moment = require('moment');
var tz = require('moment-timezone');
var D = require('../util/date');
var BigNumber = require('bignumber.js'), ZERO = new BigNumber(0);

function AgentM(Ptag) {
	EventEmitter.call(this);
	this.Ptag = Ptag;
	this.acpid = null;
	this.task = null;
	this.mtask = null;

}
util.inherits(AgentM, EventEmitter);

AgentM.prototype.start = function(acpid, task, mtask) {
	this.acpid = acpid;
	this.task = task;
	this.mtask = mtask;

	var self = this;
	process.nextTick(function() {
		self._getAgentEffuc();
	});
};

// 获取有效投注用户数
AgentM.prototype._getAgentEffuc = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _getAgentEffuc %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'select count(0) as c from (select sum(validbettotal) as _bettotal from iplay_player_gp_monthly ';
 			sql += 'where asmonth='+self.task.asmonth+' and agentcode='+self.mtask.agentcode+' group by playerid having _bettotal>='+self.mtask.ueffbettotal+') a';
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _getAgentEffuc query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			var rs = rows[0] || {};
        			if (!rs.c) rs.c = 0;
        			self.mtask._effuc = rs.c;
        			process.nextTick(function() {
        				self._getAgentGpStatistic();
        			});
        		}
       		});
		}
	});
};

// 获取游戏平台佣金汇总
AgentM.prototype._getAgentGpStatistic = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _getAgentGpStatistic %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'select sum(rake+rakeback) as gprr,sum(apiwl) as apiwl,sum(betuc) as betuc,sum(bettotal) as bettotal,';
			sql += 'sum(betcount) as betcount,sum(efftotal) as efftotal';
			sql += ' from iplay_agent_gp_monthly where asmonth=' + self.task.asmonth + ' and agentcode=' + self.mtask.agentcode;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _getAgentGpStatistic query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			var rs = '0.00', betuc = 0, betcount = 0, bettotal = '0.00', efftotal = '0.00',
        				item, apiwl = '0.00';
        			if (rows && rows.length) {
        				item = rows[0];
        				rs = item['gprr'];
        				apiwl = item['apiwl'];
        				betuc = item['betuc'];
        				betcount = item['betcount'];
        				bettotal = item['bettotal'];
        				efftotal = item['efftotal'];
        			}
        			self.mtask._apiwl = apiwl == null ? '0.00' : apiwl;
        			self.mtask._gprr = rs == null ? '0.00' : rs;
        			self.mtask._betuc = betuc == null ? 0 : betuc;
        			self.mtask._betcount = betcount == null ? 0 : betcount;
        			self.mtask._bettotal = bettotal == null ? '0.00' : bettotal;
        			self.mtask._efftotal = efftotal == null ? '0.00' : efftotal;
        			try {
        				self._calcTotalRr(); // 计算总佣金
        			} catch (ex) {
        				logger.error('_calcTotalRr fail agentcode ' + self.mtask.agentcode + ' acpid ' + self.acpid, ex);
        				self.Ptag.emit('nextMonthlyTask');
        			}
        		}
       		});
		}
	});
};

// 计算总佣金
AgentM.prototype._calcTotalRr = function() {
	var self = this, items, tmp, gprr = this.mtask._gprr, _rate = null, diff,
		limitamount, y = null, strRate, minusFlag = false;
	this.mtask._gprr = new BigNumber(this.mtask._gprr);
	this.mtask._apiwl = new BigNumber(this.mtask._apiwl);
	if (gprr * 1 < 0) {
		// strRate = '1';
		minusFlag = true;
	}

	gprr = this.mtask._gprr;
	if (this.mtask.totalstepped) {
		items = this.mtask.totalcstep.split('||');
		// var tmpgrpp = gprr;
		// if (minusFlag) tmpgrpp = ZERO;
		for (var i = 0, len = items.length; i < len; ++i) {
			tmp = items[i];
			tmp = tmp.split('|');
			limitamount = new BigNumber(tmp[0]);
			// diff = tmpgrpp.minus(limitamount);
			diff = this.mtask._apiwl.minus(limitamount);
			if (diff.toString() * 1 >= 0) {
				_rate = new BigNumber(tmp[1]).dividedBy(100);
				this.mtask.ueffbetc = tmp[2];
				break;
			}
		}
		if (!_rate && tmp & tmp.length > 2) {
			_rate = new BigNumber(tmp[1]).dividedBy(100);
			this.mtask.ueffbetc = tmp[2];
		}
	} else {
		_rate = new BigNumber(this.mtask.totalcrate).dividedBy(100);
	}
	if (_rate) y = gprr.times(_rate);
	if (y && this.mtask.totalclimit > 0) {
		limitamount = new BigNumber(this.mtask.totalclimit);
		diff = y.minus(limitamount);
		if (diff.toString() * 1 > 0) y = limitamount;
	}
	if (y != null) {
		this.mtask._gprr = y;
		strRate = _rate.toString();
	} else {
		this.mtask._gprr = ZERO;
		strRate = '0';
	}
	this.mtask._gbrate = strRate;
	this.mtask._gpbremark = this.mtask.totalclimit + '_' + this.mtask.ueffbettotal;
	process.nextTick(function() {
		self._getAgentBonus();
	});
};

// 获取存款优惠、红利
AgentM.prototype._getAgentBonus = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _getAgentBonus %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var sql = 'select sum(a.amount) as bs,a.ptype from iplay_member_manual_adjust a join iplay_member b on a.uid=b.playerid';
			sql += ' where b.agentcode='+self.mtask.agentcode+' and a.ptype in(1410,1411)';
			sql += ' and a.created>=' + self.task.cstart + ' and a.created<=' + self.task.cend + ' group by a.ptype';
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _getAgentBonus query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			var _dfees = '0.00', bonus = '0.00', item;
        			if (rows && rows.length) {
        				item = rows[0];
        				if (item.ptype == 1410) {
        					_dfees = item.bs;
        				} else {
        					bonus = item.bs;
        				}
        				item = rows[1];
        				if (item) {
	        				if (item.ptype == 1410) {
	        					_dfees = item.bs;
	        				} else {
	        					bonus = item.bs;
	        				}
	        			}
        			}
        			_dfees = (_dfees == null ? '0.00' : _dfees);
        			self.mtask._dfees = _dfees;
        			self.mtask._dfeestotal = _dfees;
        			bonus = (bonus == null ? '0.00' : bonus);
        			self.mtask._bonus = bonus;
        			self.mtask._bonustotal = bonus;
        			process.nextTick(function() {
        				self._getRakeback();
        			});
        		}
       		});
		}
	});
};

// 获取玩家返水
AgentM.prototype._getRakeback = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _getRakeback %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var se = self._getRakebackDate();
			var sql = 'select sum(a.actural) as rb from iplay_member_rakeback a join iplay_member b on a.playerid=b.playerid';
			sql += ' where b.agentcode='+self.mtask.agentcode+' and a.status=1';
			sql += ' and a.rkdate>=' + se.start + ' and a.rkdate<=' + se.end;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _getRakeback query %s', self.acpid, String(e));
        			self.Ptag.emit('nextMonthlyTask');
        		} else {
        			var rs = null;
        			if (rows && rows.length) rs = rows[0]['rb'];
        			rs = rs || '0.00';
        			self.mtask._rakeback = rs;
        			self.mtask._rakebacktotal = rs;
        			process.nextTick(function() {
        				try {
        					self._genMonthly();
        				} catch (ex) {
        					logger.error('_genMonthly fail agentcode ' + self.mtask.agentcode + ' acpid ' + self.acpid, ex);
        					self.Ptag.emit('nextMonthlyTask');
        				}
        			});
        		}
       		});
		}
	});
};

AgentM.prototype._getRakebackDate = function() {
	var m = this.task.asmonth, year = parseInt(m / 100, 10), month = m % 100 - 1,
		p = m * 100;
	return {
		start: p + 1,
		end: p + D.getDaysOfMonth(month, year)
	};
};

AgentM.prototype._genMonthly = function() {
	var _rate, diff, limitamount, agent = this.mtask;
	var lastgbrate = new BigNumber(agent._gbrate);
	if (agent._dfees > 0 && agent.dfeerate && agent.dfeerate > 0) {
		_rate = new BigNumber(agent.dfeerate).dividedBy(100);
		agent._dfees = new BigNumber(agent._dfees).times(_rate).times(lastgbrate);
		// agent._dfees = agent._dfees.times(lastgbrate);
		if (agent.dfeelimit && agent.dfeelimit > 0) {
			limitamount = new BigNumber(agent.dfeelimit);
			diff = agent._dfees.minus(limitamount);
			if (diff.toString() * 1 > 0) agent._dfees = limitamount;
		}
		agent._dfees = agent._dfees.toFixed(2);
	} else {
		agent._dfees = ZERO;
	}
	agent._dfeeremark = agent.dfeerate + '_' + agent.dfeelimit;
	if (agent._bonus > 0 && agent.bonusrate && agent.bonusrate > 0) {
		_rate = new BigNumber(agent.bonusrate).dividedBy(100);
		agent._bonus = new BigNumber(agent._bonus).times(_rate).times(lastgbrate);
		// agent._bonus = agent._bonus.times(lastgbrate);
		if (agent.bonuslimit && agent.bonuslimit > 0) {
			limitamount = new BigNumber(agent.bonuslimit);
			diff = agent._bonus.minus(limitamount);
			if (diff.toString() * 1 > 0) agent._bonus = limitamount;
		}
		agent._bonus = agent._bonus.toFixed(2);
	} else {
		agent._bonus = ZERO;
	}
	agent._bonusremark = agent.bonusrate + '_' + agent.bonuslimit;
	if (agent._rakeback > 0 && agent.rkrate && agent.rkrate > 0) {
		_rate = new BigNumber(agent.rkrate).dividedBy(100);
		agent._rakeback = new BigNumber(agent._rakeback).times(_rate).times(lastgbrate);
		// agent._rakeback = agent._rakeback.times(lastgbrate);
		if (agent.rklimit && agent.rklimit > 0) {
			limitamount = new BigNumber(agent.rklimit);
			diff = agent._rakeback.minus(limitamount);
			if (diff.toString() * 1 > 0) agent._rakeback = limitamount;
		}
		agent._rakeback = agent._rakeback.toFixed(2);
	} else {
		agent._rakeback = ZERO;
	}
	agent._rkremark = agent.rkrate + '_' + agent.rklimit;
	agent.lastmonth = new BigNumber(agent.lastmonth);
	var monthget = agent._gprr.minus(agent._dfees).minus(agent._bonus).minus(agent._rakeback).plus(agent.lastmonth),
		actural = ZERO, nextmonth = ZERO;
	if (monthget.toString() * 1 > 0) {
		actural = monthget;
	} else {
		nextmonth = monthget;
	}
	agent._monthget = monthget;
	agent._actural = actural;
	agent._nextmonth = nextmonth;
	this.mtask = agent;
	this._updateMonthly();
};

AgentM.prototype._updateMonthly = function() {
	var self = this, task = this.task, agent = self.mtask;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _insertMonthly %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.Ptag.emit('nextMonthlyTask');
		} else {
			var dt = moment().tz(TIMEZONE).unix();
			var sql = 'update iplay_agent_monthly set utotal='+agent.udtotal+',ubettotal=' + agent._betuc;
			sql += ',ubeteffc=' + agent._effuc + ',minbeteffc=' + agent.ueffbetc + ',ubettimes=' + agent._betcount;
			sql += ',gpbrokerage=' + agent._gprr.toString() + ',gbrate=' + agent._gbrate + ',gpbremark="' + agent._gpbremark + '",';
			sql += 'ubetamount=' + agent._bettotal + ',dividendtotal=' + agent._efftotal + ',dfeetotal=' + agent._dfeestotal + ',';
			sql += 'dfeeremark="' + agent._dfeeremark + '",dfee=' + agent._dfees.toString() + ',';
			sql += 'bonustotal=' + agent._bonustotal + ',bonusremark="' + agent._bonusremark + '",bonus=' + agent._bonus.toString() + ',';
			sql += 'rktotal=' + agent._rakebacktotal + ',rkremark="' + agent._rkremark + '",rk=' + agent._rakeback.toString() + ',';
			sql += 'lastmonth=' + agent.lastmonth.toString() + ',adjust=0,brokerage=' + agent._monthget.toString() + ',';
			sql += 'actural=' + agent._actural.toString() + ',nextmonth=' + agent._nextmonth.toString() + ',';
			sql += 'updated=' + dt + ',status=30 where status=1 and asmonth=' + task.asmonth + ' and agentcode=' + agent.agentcode;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _insertMonthly query %s', self.acpid, String(e));
        		}
        		self.task = null;
				self.mtask = null;
        		self.Ptag.emit('nextMonthlyTask');
       		});
		}
	});
};

module.exports = AgentM;
