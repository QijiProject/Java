var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');
var myutil = require('../util/util');

function OB() {
	EventEmitter.call(this);
	this.jkey = 'ob';
	this._iv = 'AAAAAAAAAAA=';
}
util.inherits(OB, EventEmitter);

OB.prototype.start = function(gp) {
	this.gp = gp;
};

OB.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

OB.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg;
	var str = 'random=' + new Date().getTime() + '&sn=' + gpCfg.propertyid + String(o.dno),
		data = myutil.des1({key: gpCfg.deskey, iv: this._iv,
	 		alg: 'des-ede3-cbc', autoPad: true, content: str}), sign;

	sign = myutil.md5(data + gpCfg.md5key);
	sign = encodeURIComponent(new Buffer(sign, 'hex').toString('base64'));
	data = encodeURIComponent(data);

    request({
		method: 'POST',
		url: gpCfg.apiurl + gpCfg.checktransfer + '?propertyId=' + gpCfg.propertyid + '&data=' + data + '&sign=' + sign,
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = data.error_code, status = 2;
				if (code == 'OK') {
					code = 0;
					if (data.transferState == 1) {
						status = 0;
					} else if (data.transferState == 2) {
						status = 1;
					}
				} else  if (code == 'TRANS_NOT_EXISTED') {
					code = 2;
					status = -1;
				} else {
					code = 1;
				}
				logger.info('[CheckTransfer] OB dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('OB checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new OB();
