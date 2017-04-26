var logger = require('../util/log4js').getLogger('knbs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var config = require('../config/config');
var gr = require('../util/gr');
var FIRST_TIMEOUT = 5000, REFRESH_TIMEOUT = 180000;

function GpServ() {
	EventEmitter.call(this);
	this.thriftServ = null;

	this.gpmap = {};

	this.lastup = 0;

	this.zkchange = 0;

	this.inited = false;

	this.kzac = 10000;

	this.timeHandle = null;

	this.on('check', this.checkGp.bind(this));
}
util.inherits(GpServ, EventEmitter);

GpServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.pull(false);
};

GpServ.prototype.pull = function(im) {
	this.thriftServ.emit('pulldata', this.lastup, config.thriftKey.gpaccount, 0, 0, (im?1:0), '', this.inited);
};

GpServ.prototype.checkChange = function(newt) {
	var t = parseInt(newt, 10), self = this;
	if (isNaN(t) || this.zkchange >= t) return;
	if (this.zkchange == 0) {
		this.zkchange = t;
		return;
	}
	this.zkchange = t;
	setTimeout(function() {
		self.pull(true);
	}, 2000);
};

GpServ.prototype.checkGp = function(data, inited, isim) {
	if (data == null) {
		logger.error('[Gp Service] get gameplatform config error');
		this.refresh();
		return;
	}
	var gp, exgp;
	for (var i = 0, len = data.length; i < len; ++i) {
		gp = data[i];
		exgp = this.gpmap[gp.gpid];
		if (!exgp || exgp.updated < gp.updated) {
			gp.classN = gr.String.capitalFirst(gp.beaname);
			gp.iskz = parseInt(gp.iskz, 10);
			if (gp.iskz == 1) this.kzac = gp.gpid;
			gp.status = parseInt(gp.status, 10);
			gp.cfg = JSON.parse(gp.basecfg);
			gp.ucfg = JSON.parse(gp.usercfg);
			this.gpmap[gp.gpid] = gp;
			if (this.inited) logger.info('[Gp Service] update gp ' + gp.gpid);
			if (this.lastup < gp.updated) this.lastup = gp.updated;
		}
	}

	if (!inited) {
		this.inited = true;
		logger.info('[Gp Service] start gp ok');
		require('./mongoService').start(this.thriftServ);
	}

	if (!isim) this.refresh();
};

GpServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull(false);
	}, this.inited ? REFRESH_TIMEOUT : FIRST_TIMEOUT);
};

GpServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

GpServ.prototype.getGP = function(gpid) {
	return this.gpmap[gpid];
};

GpServ.prototype.getKzac = function() {
	return this.kzac;
};

GpServ.prototype.destroy = function() {
};

module.exports = new GpServ;
