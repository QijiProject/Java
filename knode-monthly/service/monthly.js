var logger = require('../util/log4js').getLogger('knmo');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var DbMgr = require('../comp/dbService');
var Digest = require('./digest');
var config = require('../config/config');
var moment = require('moment');
var tz = require('moment-timezone');
var DATE_PATTERN = 'YYYY-MM-DD HH:mm:ss', TIMEZONE = 'Asia/Shanghai';

function Monthly() {
	EventEmitter.call(this);
	this.App = null;
	this.acpids = [];
	
	this.processing = {}; // acpid -> true/false

	this.mcsql = 'select id from api_mc_00.api_acprovider where status=1 order by joindate asc';
	this.list = '';
	this.ntask = '';

	this.digestObj = {}; // pid -> Digest
	this.plimit = 2; // parallel

	this.on('startAcp', this._startAcp.bind(this));
	this.on('nextAcp', this._nextAcp.bind(this));
	this.on('completeAcp', this._completeAcp.bind(this));
}
util.inherits(Monthly, EventEmitter);

Monthly.prototype.start = function(app) {
	this.App = app;
	this.buildAcpIds();
};

Monthly.prototype.buildAcpIds = function() {
	var self = this;
	this.acpids = [];
	DbMgr.getConnection(config.mcdbkey, 1, function(err, ctype, connection) {
		if (err) {
			DbMgr.closeConn(ctype, connection);
			logger.error('get mc connnection error');
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
					self.list = self.acpids.join(', ');
					self._nextAcp();
				}
			});
		}
	});
};

Monthly.prototype._startAcp = function() {
	var acpid = this.acpids.shift();
	if (acpid) {
		this.ntask = acpid + ' ('+ moment().tz(TIMEZONE).format(DATE_PATTERN) +')';
		this._emitInfo();
		this._queryAcpTasks(acpid);
	} else { // loop
		this.buildAcpIds();
	}
};

Monthly.prototype._emitInfo = function() {
	this.App.emitInfo('keizak_ksc_node_info', JSON.stringify({
		"appName": config.appname,
		"tasklist": this.list,
		"ntask": this.ntask
	}));
};

Monthly.prototype._queryAcpTasks = function(acpid) {
	if (this.processing[acpid]) {
		this.emit('nextAcp');
		return;
	}
	var self = this;
	DbMgr.getConnection(acpid, 1, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s _queryAcpTasks %s', acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			self.emit('nextAcp');
		} else {
			connection.query('select * from iplay_agent_settlements where status<3', function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s _queryAcpTasks query %s', acpid, String(e));
        			self.emit('nextAcp');
        		} else {
        			if (rows.length == 0) {
        				self.emit('nextAcp');
        			} else {
        				self._checkProcess(acpid, rows);
        			}
        		}
       		});
		}
	});
};

Monthly.prototype._checkProcess = function(acpid, tasks) {
	if (!this.processing[acpid]) {
		this.processing[acpid] = true;
	} else {
		this.emit('nextAcp');
		return;
	}
	var dg = null, i = 1;
	for (; i <= this.plimit; ++i) {
		dg = this.digestObj[i];
		if (!dg || !dg.isBusy()) break;
	}
	if (!dg) dg = this.digestObj[i] = new Digest(this);
	if (!dg.isBusy()) {
		dg.start(acpid, tasks);
	} else {
		this.processing[acpid] = false;
		this.emit('nextAcp');
	}
};

Monthly.prototype._completeAcp = function(acpid) {
	this.processing[acpid] = false;
	this.emit('nextAcp');
};

Monthly.prototype._nextAcp = function() {
	var self = this;
	setTimeout(function() {
		self.emit('startAcp');
	}, 10000);
};

module.exports = new Monthly();
