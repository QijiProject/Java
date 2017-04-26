var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function CPWin() {
	EventEmitter.call(this);
	this.jkey = 'cpwin';
}
util.inherits(CPWin, EventEmitter);

CPWin.prototype.start = function(gp) {
	this.gp = gp;
};

CPWin.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

CPWin.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] CPWin dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new CPWin();
