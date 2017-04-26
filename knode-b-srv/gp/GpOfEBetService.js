var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');
var moment = require('moment');
var NodeRSA = require('node-rsa');
var myutil = require('../util/util');

function EBet() {
	EventEmitter.call(this);
	this.jkey = 'EBet';
}
util.inherits(EBet, EventEmitter);

EBet.prototype.start = function(gp) {
	this.gp = gp;
	this.priKey = gp.cfg.prikey;
	this.rsaKey = new NodeRSA(this.priKey, 'pkcs8-private-pem', {signingScheme: 'pkcs1-md5'});
};

EBet.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

EBet.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg,
		sign = this.rsaKey.sign(o.dno, 'base64');

    request({
		method: 'POST',
		url: gpCfg.apiurl + gpCfg.checktransfer,
		form: {"channelId": gpCfg.channelid, "rechargeReqId": o.dno, "signature": sign},
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = 0, status = 2;
				if (data.status == 200) {
					if (data.rechargeReqId == o.dno) {
						status = 0;
					}
				} else if (data.status == -1) {
					status = 1;
				} else if (data.status == 505) {
					code = 3;
				}
				logger.info('[CheckTransfer] EBet dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('EBet checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new EBet();
