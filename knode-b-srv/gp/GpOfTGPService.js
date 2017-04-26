var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function TGP() {
	EventEmitter.call(this);
	this.jkey = 'sxing';
}
util.inherits(TGP, EventEmitter);

TGP.prototype.start = function(gp) {
	this.gp = gp;
};

TGP.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

TGP.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] TGP dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new TGP();
