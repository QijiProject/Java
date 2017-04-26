var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function KG() {
	EventEmitter.call(this);
	this.jkey = 'kg';
}
util.inherits(KG, EventEmitter);

KG.prototype.start = function(gp) {
	this.gp = gp;
};

KG.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

KG.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] KG dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new KG();
