var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');
var moment = require('moment');
var myutil = require('../util/util');

function BBIN() {
	EventEmitter.call(this);
	this.jkey = 'bbin';
}
util.inherits(BBIN, EventEmitter);

BBIN.prototype.start = function(gp) {
	this.gp = gp;
};

BBIN.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

BBIN.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg,
		md5k = myutil.md5(gpCfg.website + gpCfg.checkTransferKeyB + moment().utcOffset(-4).format('YYYYMMDD')),
		key = myutil.getRandomString(9) + md5k + myutil.getRandomString(3);

    request({
		method: 'POST',
		url: gpCfg.checkTransaction,
		form: {"website": gpCfg.website, "transid": o.dno, "key": key.toLowerCase()},
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = 0, status = 2;
				if (data.result) {
					data = data.data;
					if (data.Status == 1) {
						status = 0;
					}
				} else {
					data = data.data;
					if (data.Code == '44444') {
						code = 3;
					} else if (data.Message && data.Message.indexOf('Not found Transaction') != -1) {
						code = 2;
						status = -1;
					}
				}
				logger.info('[CheckTransfer] BBIN dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('BBIN checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new BBIN();
