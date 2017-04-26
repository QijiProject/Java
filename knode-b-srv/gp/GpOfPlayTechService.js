var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');


function PlayTech() {
	EventEmitter.call(this);
	this.jkey = 'playtech';
}
util.inherits(PlayTech, EventEmitter);

PlayTech.prototype.start = function(gp) {
	this.gp = gp;

};

PlayTech.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

PlayTech.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg, self = this;

	var jsonBody = JSON.stringify({MerchantCode: gpCfg.merchantcode, PlayerId: o.player.playerid, TransactionId: o.dno, ProductWallet: 102});

    request({
		method: 'POST',
		url: gpCfg.apiUrl,
		proxy: config.proxy,
		body: jsonBody,
		headers: {
			'Charset': 'UTF-8',
			'Content-Type': 'application/json'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = 0, b = data.Code, status = 2;
				if (b == 0) {
					code = 0;
					if (data.Status == 'Approved') {
						status = 0;
					}
				} else  if (b == 509) {
					code = 2;
					status = -1;
				} else {
					code = 1;
				}
				logger.info('[CheckTransfer] PLAYTECH dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('playtech checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new PlayTech();
