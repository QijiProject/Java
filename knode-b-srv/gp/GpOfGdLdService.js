var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var CURRENCY = 'CNY';

function GdLd() {
	EventEmitter.call(this);
	this.jkey = 'gd_ld';
}
util.inherits(GdLd, EventEmitter);

GdLd.prototype.start = function(gp) {
	this.gp = gp;
};

GdLd.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

GdLd.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] GDLD dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new GdLd();
