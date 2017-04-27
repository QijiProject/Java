var EventEmitter = require('events').EventEmitter;
var util = require('util');
var async = require('async');
var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');
var TIMEZONE = 'Asia/Shanghai';
var moment = require('moment');
var tz = require('moment-timezone');
var GenGpData = require('./gen_gpdata');
var AgentM = require('./gen_settlement');
var gpObj = {};
var AGENTS_PAGESIZE = 150;

function AcpDigest(Ptag) {
	EventEmitter.call(this);
	this.Ptag = Ptag;
	this.processing = false;
	this.acpid = null;
	this.tasks = [];
	this.nowtask = null;
	this.gps = [];
	this.genGpData = new GenGpData(this);
	this.genAgentM = new AgentM(this);

	// this.startIdx = 0;
	// this.currPage = 1;

	this.monthlies = [];
	this.groupMap = null; // groupid -> data

	this.on('startTask', this.startTask.bind(this));
	this.on('nextTask', this._nextTask.bind(this));
	this.on('updateTask', this._updateTask.bind(this));
	this.on('nextMonthlyTask', this._nextMonthlyTask.bind(this));
	this.on('doGenMonthly', this._doGenMonthly.bind(this));
	this.on('complete', this._complete.bind(this));
}
util.inherits(AcpDigest, EventEmitter);

AcpDigest.prototype.start = function(acpid, tasks) {
	this.processing = true;
	this.acpid = acpid;
	this.tasks = tasks;
	this.startTask();
};

AcpDigest.prototype.startTask = function() {
	var task = this.tasks.shift(); // agent settlement
	if (task) {
		this.monthlies = [];
		// this.startIdx = 0;
		// this.currPage = 1;

		this.nowtask = task;
		if (this.nowtask.status == 0) {
			this.initAsmonth();
		} else if (this.nowtask.status == 1) {
			this.genPlayerGpMonthly();
		} else if (this.nowtask.status == 2) {
			// 开始生成月结记录
			this._genMonthly();
		} else {
			this.emit('nextTask');
		}
	} else {
		this._complete();
	}
};

// 初始化月结数据
AcpDigest.prototype.initAsmonth = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s initAsmonth %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextTask');
		} else {
			var dt = moment().tz(TIMEZONE).unix(), t, s = self.nowtask.asmonth + '';
			t = moment(s.substr(0, 4) + '-' + s.substr(4, 2) + '-01 00:00:00').add(1, 'months');
			t = t.tz(TIMEZONE).unix();
			var sql = 'insert into iplay_agent_monthly (select ' + self.nowtask.asmonth + ',a.agentcode,';
			sql += '0,0,0,0,0,0,1,"",0,0,0,"",0,0,"",0,0,"",0,0,0,0,0,0,' + dt + ',' + dt + ',0,"",0';
			sql += ' from iplay_agents a join iplay_agent_profile b on a.agentid=b.agentid where (a.agentstatus=99 or a.agentstatus=35) and b.regdate<'+t+')';
			sql += ' on duplicate key update updated=' + dt;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s initAsmonth query %s', self.acpid, String(e));
        			self.emit('nextTask');
        		} else {
        			process.nextTick(function() {
        				self._updateTask(1);
        			});
        		}
       		});
		}
	});
};

function genGpWaterFn(gpid, acpid, task, dt) {
	return function(callback) {
		gpObj[gpid].getWater(acpid, task, dt, callback);
	};
}

// 生成玩家月结数据
AcpDigest.prototype.genPlayerGpMonthly = function() {
	if (this.gps.length === 0) {
		this.getGpList();
		return;
	}
	var gp, arr = [], self = this, dt = moment().tz(TIMEZONE).unix();
	for (var i = 0, len = this.gps.length; i < len; ++i) {
		gp = this.gps[i];
		try {
			if (!gpObj[gp.gpid]) gpObj[gp.gpid] = require('../gpmonth/' + gp.gpid);
			arr.push(genGpWaterFn(gp.gpid, this.acpid, this.nowtask, dt));
		} catch (e) {
			continue;
		}
	}
	async.series(arr, function(err, rs) {
		if (err) {
			logger.error('genPlayerMonthly async error %s', String(err));
			self.Ptag.emit('nextTask');
		} else {
			process.nextTick(function() {
				self._updateTask(2);
			});
		}
	});
};

// 获取平台列表
AcpDigest.prototype.getGpList = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s getGpList get gameplatform %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextTask');
		} else {
			connection.query('select gpid from iplay_gameplatform where status=88 and iskz=0', function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s getGpList get gameplatform query %s', self.acpid, String(e));
        			self.emit('nextTask');
        		} else {
        			if (!rows || rows.length === 0) {
        				self.emit('nextTask');
        				return;
        			}
        			self.gps = rows;
        			process.nextTick(function() {
        				self.genPlayerGpMonthly();
        			});
        		}
       		});
		}
	});
};

// 更新结算单状态为 0-待初始化数据，1-初始化代理数据完成，2-生成结算数据完成
AcpDigest.prototype._updateTask = function(stat) {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _updateTask %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextTask');
		} else {
			var dt = moment().tz(TIMEZONE).unix();
			connection.query('update iplay_agent_settlements set status='+stat+',updated='+dt+' where asmonth=' + self.nowtask.asmonth, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql get connection on %s _updateTask query %s', self.acpid, String(e));
        			self.emit('nextTask');
        		} else {
        			if (stat == 1) {
        				self.genPlayerGpMonthly();
        			} else if (stat == 2) {
        				// 开始生成月结记录
        				self._genMonthly();
        			} else if (stat == 3) {
        				self.emit('nextTask');
        			}
        		}
       		});
		}
	});
};

AcpDigest.prototype._genMonthly = function() {
	var self = this;
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _genMonthly %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextTask');
		} else {
			// self.startIdx = (self.currPage - 1) * AGENTS_PAGESIZE;
			var sql = 'select b.agentid,a.agentcode,a.asmonth,a.status,b.groupid,c.dfeerate,c.dfeelimit,c.rkrate,c.rklimit,';
			sql += 'c.ueffbettotal,c.ueffbetc,c.totalclimit,c.totalcrate,c.totalstepped,ifnull(c.totalcstep,"") as totalcstep,';
			sql += 'ifnull((select d.nextmonth from iplay_agent_monthly d ';
            sql += 'where d.agentcode=a.agentcode and d.asmonth<'+self.nowtask.asmonth+' order by d.asmonth desc limit 1),0) as lastmonth,';
			sql += 'ifnull((select count(*) from iplay_member e where e.agentcode=a.agentcode and e.playerstatus=88),0) as udtotal,';
			sql += 'c.bonusrate,c.bonuslimit from iplay_agent_monthly a inner join iplay_agents b on a.agentcode=b.agentcode inner join iplay_agent_group c on b.groupid=c.groupid';
			sql += ' where a.status<30 and a.asmonth='+self.nowtask.asmonth+' order by a.agentcode asc limit ' + AGENTS_PAGESIZE;
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _genMonthly query %s', self.acpid, String(e));
        			self.emit('nextTask');
        		} else {
        			if (!rows || rows.length == 0) {
        				self.emit('updateTask', 3);
        			} else {
        				self.monthlies = rows;
        				// self.currPage++;
        				process.nextTick(function() {
        					self.digestMonthlies();
        				});
        			}
        		}
       		});
		}
	});
};

AcpDigest.prototype.digestMonthlies = function() {
	var mtask = this.monthlies.shift(), self = this;
	if (mtask) {
		this._digest(mtask);
	} else {
		setTimeout(function() {
			self._genMonthly();
		}, 1000);
	}
};

AcpDigest.prototype._digest = function(mtask) {
	if (mtask.status == 0) { // 生成各游戏平台佣金抽水
		if (!this.groupMap) {
			this._getGroupData(mtask);
		} else {
			this.genGpData.start(this.acpid, this.nowtask, mtask);
		}
	} else if (mtask.status == 1) { // 生成结算数据
		this._doGenMonthly(mtask);
	} else {
		this.emit('nextMonthlyTask');
	}
};

// 生成代理月结数据
AcpDigest.prototype._doGenMonthly = function(mtask) {
	this.genAgentM.start(this.acpid, this.nowtask, mtask);
};

AcpDigest.prototype._getGroupData = function(rr) {
	var self = this;
	if (!this.groupMap) this.groupMap = {};
	DbMgr.getConnection(this.acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _getGroupData %s', self.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextTask');
		} else {
			connection.query('select groupid,gpid,rtype,rrlimit,rrate,stepped,stepcond from iplay_agroup_rr', function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _getGroupData query %s', self.acpid, String(e));
        			self.emit('nextTask');
        		} else {
        			if (rows.length === 0) { // 未设游戏平台抽佣抽水比例
        				self._digest(rr);
        			} else {
        				self._mapGroup(rows, rr);
        			}
        		}
       		});
		}
	});
};

AcpDigest.prototype._mapGroup = function(rows, rr) {
	var item, tmp, s, x, f, l, key;
	for (var i = 0, len = rows.length; i < len; ++i) {
		item = rows[i];
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
		key = item.gpid + '_' + item.rtype;
		if (!this.groupMap[item.groupid]) this.groupMap[item.groupid] = {};
		this.groupMap[item.groupid][key] = item;
	}
	this._digest(rr);
};

AcpDigest.prototype.getAgentRr = function(groupid) {
	return this.groupMap[groupid];
};

AcpDigest.prototype.isBusy = function() {
	return this.processing;
};

AcpDigest.prototype._nextTask = function() {
	var self = this;
	setTimeout(function() {
		self.emit('startTask');
	}, 5000);
};

AcpDigest.prototype._nextMonthlyTask = function() {
	var self = this;
	setTimeout(function() {
		self.digestMonthlies();
	}, 100);
};

AcpDigest.prototype._complete = function() {
	this.processing = false;
	this.gps = [];
	this.nowtask = null;

	this.monthlies = [];
	this.groupMap = null;
	// this.startIdx = 0;
	// this.currPage = 1;

	this.Ptag.emit('completeAcp', this.acpid);
};

module.exports = AcpDigest;
