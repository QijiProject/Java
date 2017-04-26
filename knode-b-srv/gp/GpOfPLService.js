var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function PL() {
	EventEmitter.call(this);
	this.jkey = 'pl';
}
util.inherits(PL, EventEmitter);

PL.prototype.start = function(gp) {
	this.gp = gp;
};

PL.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

PL.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] PL dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new PL();
