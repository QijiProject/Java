var logger = require('../util/log4js').getLogger('kfwater');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var config = require('../config/config');
var AcpService = require('./acpService');
var FIRST_TIMEOUT = 5000, REFRESH_TIMEOUT = 30000;

function DomainServ() {
	EventEmitter.call(this);
	this.thriftServ = null;

	this.ditemMap = {};
	this.dmap = {};

	this.lastup = 0;

	this.inited = false;

	this.timeHandle = null;

	this.on('check', this.checkDomain.bind(this));
}
util.inherits(DomainServ, EventEmitter);

DomainServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.pull();
};

DomainServ.prototype.pull = function() {
	this.thriftServ.emit('pulldata', this.lastup, config.thriftKey.domain, 0, 0, 0, '', this.inited);
};

DomainServ.prototype.checkDomain = function(data, inited) {
	if (data == null) {
		logger.error('[Domain Service] get domain config error');
		this.refresh();
		return;
	}
	var d, exd, dc = 0;
	for (var i = 0, len = data.length; i < len; ++i) {
		d = data[i];
		exd = this.ditemMap[d.id];
		if (!exd || exd.updated < d.updated) {
			this.ditemMap[d.id] = d;
			if (d.status == 2) { // abort
				this.dmap[d.dname] = undefined;
				delete this.dmap[d.dname];
			} else {
				if (exd) {
					this.dmap[exd.dname] = undefined;
					delete this.dmap[exd.dname];
				}
				if (AcpService.acpExists(d.acpid) || this.inited) {
					dc++;
					this.dmap[d.dname] = d.acpid;
				}
			}
			if (this.lastup < d.updated) this.lastup = d.updated;
			if (this.inited) logger.info('[Domain Service] update domain ' + d.acpid + ' - ' + d.id);
		}
	}

	if (!inited) {
		this.inited = true;
		logger.info('[Domain Service] start domain service ok, attach=' + dc);
		require('./mongoService').start(this.thriftServ);
	}

	this.refresh();
};

DomainServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull();
	}, this.inited ? REFRESH_TIMEOUT : FIRST_TIMEOUT);
};

DomainServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

DomainServ.prototype.getAcpid = function(domain) {
	return this.dmap[domain];
};

DomainServ.prototype.destroy = function() {
};

module.exports = new DomainServ;
