var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function SXing() {
	EventEmitter.call(this);
	this.jkey = 'sxing';
}
util.inherits(SXing, EventEmitter);

SXing.prototype.start = function(gp) {
	this.gp = gp;
};

SXing.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

SXing.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] SXing dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new SXing();
