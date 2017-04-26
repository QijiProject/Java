 var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');

function Salon() {
	EventEmitter.call(this);
	this.jkey = 'salon';
}
util.inherits(Salon, EventEmitter);

Salon.prototype.start = function(gp) {
	this.gp = gp;
};

Salon.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

Salon.prototype.checkTransfer = function(o, callback) {
	logger.info('[CheckTransfer] SaGaming dno=' + o.dno + ', c=0, s=2');
	callback(0, {c: 0, s: 2});
};

module.exports = new Salon();
