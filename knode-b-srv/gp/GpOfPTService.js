var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');

function PT() {
	EventEmitter.call(this);
	this.jkey = 'pt';
	this.prefix = 'kz_';
}
util.inherits(PT, EventEmitter);

PT.prototype.start = function(gp) {
	this.gp = gp;
};

PT.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

PT.prototype.checkTransfer = function(o, callback) {
	var acpid = o.acinfo.acpid, uname = this.prefix + acpid + '.' + o.player.playername;
	var gpCfg = this.gp.cfg;

    request({
		method: 'GET',
		url: gpCfg.checkTransaction.replace('${membercode}', uname).replace('${externaltransactionid}', o.dno).replace('${producttype}', '0'),
		proxy: config.proxy,
		rejectUnauthorized: false,
		headers: {
			'merchantname': gpCfg.merchantname,
			'merchantcode': gpCfg.merchantcode
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = 0, status = 2;
				if (data.Code == '0') {
					if (data.Status == 'Approved') {
						status = 0;
					} else if (data.Status == 'Declined') {
						status = 1;
					}
				} else if (data.Code == '53') {
					code = 4;
				} else if (data.Code == '450' || data.Code == '451') {
					code = 2;
					status = -1;
				} else {
					code = 1;
				}
				logger.info('[CheckTransfer] PT dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('PT checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new PT();
