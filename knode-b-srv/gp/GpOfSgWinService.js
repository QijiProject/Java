var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function SgWin() {
	EventEmitter.call(this);
	this.jkey = 'sgwin';
}
util.inherits(SgWin, EventEmitter);

SgWin.prototype.start = function(gp) {
	this.gp = gp;
};

SgWin.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

SgWin.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] SgWin dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new SgWin();
