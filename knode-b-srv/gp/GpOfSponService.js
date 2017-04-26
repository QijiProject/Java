var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');

function Spon() {
	EventEmitter.call(this);
	this.jkey = 'spon';
}
util.inherits(Spon, EventEmitter);

Spon.prototype.start = function(gp) {
	this.gp = gp;
};

Spon.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

// {
//	code: 0-成功，1-请求错误，2-转账记录不存在，3-系统维护，4-用户不存在
//	status: -1-转账记录不存在, 0-成功，1-失败，2-未知
//}
Spon.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg;

    request({
		method: 'POST',
		url: gpCfg.apiurl + gpCfg.checkTransfer,
		form: {"vendor_id": gpCfg.vendorId, "vendor_trans_id": o.dno, "wallet_id":1},
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code, status = 2, dt;
				if (data.error_code == 0 || data.error_code == 1 || data.error_code == 2) {
					code = data.error_code;
				} else if (data.error_code == 10) {
					code == 3;
				} else {
					code == 1;
				}
				dt = data.Data;
				if (dt && dt.status) {
					status = dt.status;
				}
				logger.info('[CheckTransfer] Spon dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('spon checkTransfer parse response error %s %s', e, body);
				callback(1414, 2);
			}
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new Spon();
