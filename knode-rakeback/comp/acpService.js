var logger = require('../util/log4js').getLogger('knrb');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mysql = require('mysql');
var config = require('../config/config');
var FIRST_TIMEOUT = 5000, REFRESH_TIMEOUT = 15000;

function AcpServ() {
	EventEmitter.call(this);
	this.thriftServ = null;

	this.dbServ = null;

	this.acpmap = {};

	this.lastup = 0;

	this.inited = false;

	this.timeHandle = null;

	this.on('check', this.checkAcps.bind(this));
}
util.inherits(AcpServ, EventEmitter);

AcpServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.dbServ = require('./dbService');

	this.pull(false);
};

AcpServ.prototype.pull = function(im) {
	this.thriftServ.emit('pulldata', this.lastup, config.thriftKey.acp, 0, 0, (im?1:0), '', this.inited);
};

AcpServ.prototype.checkAcps = function(data, inited) {
	if (data == null) {
		logger.error('[Acp Service] get acp list error');
		this.refresh();
		return;
	}
	var acp, wdb, ac = 0;
	for (var i = 0, len = data.length; i < len; ++i) {
		acp = data[i];
		wdb = null;
		if (acp.status == 2) {
			this.acpmap[acp.id] = undefined;
			delete this.acpmap[acp.id];
			if (this.inited) logger.info('[Acp Service] remove acp ' + acp.id);
			if (this.dbServ.dbOk()) {
				wdb = this.dbServ.getDbMaster(acp.id);
				if (wdb) this.dbServ.removeDbs(wdb);
				wdb = this.dbServ.getDbWater(acp.id);
				if (wdb) this.dbServ.removeDbs(wdb);
			}
		} else {
			ac++;
			this.acpmap[acp.id] = acp;
			if (this.inited && acp.nstep == 100) logger.info('[Acp Service] update acp ' + acp.id);
		}
		if (this.lastup < acp.updated) this.lastup = acp.updated;
	}

	if (!inited) {
		this.inited = true;
		logger.info('[Acp Service] start acp service ok, nums=' + ac);
		this.dbServ.start(this.thriftServ);
	}

	this.refresh();
};

AcpServ.prototype.acpExists = function(acpid) {
	var acp = this.acpmap[acpid];
	if (acp) return true;
	return false;
};

AcpServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull(false);
	}, this.inited ? REFRESH_TIMEOUT : FIRST_TIMEOUT);
};

AcpServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

AcpServ.prototype.destroy = function() {
};

module.exports = new AcpServ;
