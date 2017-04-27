var logger = require('../util/log4js').getLogger('knrb');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var DbMgr = require('../comp/dbService');
var config = require('../config/config');
var moment = require('moment');
var tz = require('moment-timezone');
var DATE_PATTERN = 'YYYY-MM-DD HH:mm:ss', TIMEZONE = 'Asia/Shanghai';

function RakeBack() {
	EventEmitter.call(this);
	this.App = null;
	this.acpids = [];
	this.gpObj = {};
	this.nowTasks = [];

	this.mcsql = 'select id from api_mc_00.api_acprovider where status=1 order by joindate asc';
	this.acpsql = 'select * from iplay_member_settlements where status in(0,1) and gpid<>39500154618880';

	this.list = '';
	this.ntask = '';

	this.on('startAcp', this._startAcp.bind(this));
	this.on('nextAcp', this._nextAcp.bind(this));

	this.on('startAcpGpid', this._startAcpGpid.bind(this));
	this.on('nextAcpGpid', this._nextAcpGpid.bind(this));
}
util.inherits(RakeBack, EventEmitter);

RakeBack.prototype.start = function(app) {
	this.App = app;
	this.buildAcpIds();
};

RakeBack.prototype.buildAcpIds = function() {
	var self = this;
	this.acpids = [];
	DbMgr.getConnection(config.mcdbkey, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('get mc connnection error');
			DbMgr.closeConn(ctype, connection);
			self._nextAcp();
		} else {
			connection.query(self.mcsql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('mysql getconnection on buildAcpIds %s query %s', config.mcdbkey, String(e));
					self._nextAcp();
				} else {
					var len = rows.length, acpid;
					for (var i = 0; i < len; ++i) {
						acpid = rows[i]['id'];
						self.acpids.push(acpid);
					}
					// console.log(self.acpids)
					self.acpids = self.acpids.slice(0, len / 2); // front
					// console.log(self.acpids)
					self.list = self.acpids.join(', ');
					// this.acpids = this.acpids.slice(len / 2); // back
					self._nextAcp();
				}
			});
		}
	});
};

RakeBack.prototype._startAcp = function() {
	var acpid = this.acpids.shift();
	if (acpid) {
		this.ntask = acpid + ' ('+ moment().tz(TIMEZONE).format(DATE_PATTERN) +')';
		this._emitInfo();
		this.nowTasks = []; // clear tasks
		this._queryAcpTasks(acpid);
	} else { // loop
		this.buildAcpIds();
	}
};

RakeBack.prototype._emitInfo = function() {
	this.App.emitInfo('keizak_ksc_node_info', JSON.stringify({
		"appName": config.appname,
		"tasklist": this.list,
		"ntask": this.ntask
	}));
};

RakeBack.prototype._queryAcpTasks = function(acpid) {
	var self = this;
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('get _queryAcpTasks connnection error %s', acpid);
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcp');
		} else {
			connection.query(self.acpsql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
				if (e) {
					logger.error('mysql getconnection on _queryAcpTasks %s query %s', acpid, String(e));
					self.emit('nextAcp');
				} else {
					if (rows.length == 0) {
        				self.emit('nextAcp');
        			} else {
        				self.nowTasks = rows;
        				self._startAcpGpid(acpid); // start gp statistic
        			}
				}
			});
		}
	});
};

RakeBack.prototype._nextAcp = function() {
	var self = this;
	setTimeout(function() {
		self.emit('startAcp');
	}, 3000);
};

RakeBack.prototype._startAcpGpid = function(acpid) {
	var task = this.nowTasks.shift();
	if (task) {
		if (!this.gpObj[task.gpid]) {
			var x = require('../gpday/' + task.gpid);
			this.gpObj[task.gpid] = new x();
			this.gpObj[task.gpid].start(this);
		}
		task['acpid'] = acpid;
		this.gpObj[task.gpid].digestTask(task);
	} else {
		this.emit('startAcp'); // no task, go to next acpid
	}
};

RakeBack.prototype._nextAcpGpid = function(acpid) {
	var self = this;
	setTimeout(function() {
		self.emit('startAcpGpid', acpid);
	}, 1000);
};

module.exports = new RakeBack();
