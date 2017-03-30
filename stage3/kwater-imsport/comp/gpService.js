var logger = require('../util/log4js').getLogger('wimsport');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Nedis = require('./nedis');
var config = require('../config/config');

function GpServ() {
	EventEmitter.call(this);
	this.thriftServ = null;
	this.gp = null;

	this.initMongo = false;

	this.inited = false;

	this.timeHandle = null;

	this.on('check', this.checkGp.bind(this));
}
util.inherits(GpServ, EventEmitter);

GpServ.prototype.start = function(thriftServ) {
	this.thriftServ = thriftServ;
	
	this.pull();
};

GpServ.prototype.pull = function() {
	this.thriftServ.emit('pulldata', config.gpaid, config.thriftKey.gpaccount, 0, this.inited);
};

GpServ.prototype.checkGp = function(gpid, data, inited) {
	if (data == null || data.gpid != config.gpaid) {
		logger.error('[Gp Service] get gameplatform config error ' + data.gpid);
		this.refresh();
		return;
	}
	try {
		data.basecfg = JSON.parse(data.basecfg);
		data.usercfg = JSON.parse(data.usercfg);
	} catch (e) {
		logger.error('[Gp Service] parse gameplatform config error');
		return;
	}
	this.gp = data;

	if (!inited) {
		this.inited = true;
		logger.info('[Gp Service] start gp ok ' + config.gpaid);
		require('./mongoService').start(this.thriftServ);
	}

	this.refresh();
};

GpServ.prototype.refresh = function() {
	if (this.timeHandle) clearTimeout(this.timeHandle);
	var self = this;
	this.timeHandle = setTimeout(function() {
		self.pull();
	}, 30000);
};

GpServ.prototype.poll = function() {
	if (!this.inited) return;
	var self = this;
	process.nextTick(function() {
		self.refresh();
	});
};

GpServ.prototype.getGp = function() {
	return this.gp;
};

GpServ.prototype.destroy = function() {
};

module.exports = new GpServ;
