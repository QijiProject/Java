var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function OeeBetLd() {
	EventEmitter.call(this);
	this.jkey = 'oee_ld';
}
util.inherits(OeeBetLd, EventEmitter);

OeeBetLd.prototype.start = function(gp) {
	this.gp = gp;
};

OeeBetLd.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

OeeBetLd.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] OeeLd dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new OeeBetLd();
