var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function MG() {
	EventEmitter.call(this);
	this.jkey = 'mg';
}
util.inherits(MG, EventEmitter);

MG.prototype.start = function(gp) {
	this.gp = gp;
};

MG.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

MG.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] MG dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new MG();
