var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var config = require('../config/config');

function NT() {
	EventEmitter.call(this);
	this.jkey = 'nt';
}
util.inherits(NT, EventEmitter);

function leftPadAcpid(acpid) {
	var s;
	if (acpid.length === 1) {
		s = '00' + acpid;
	} else if (acpid.length === 2) {
		s = '0' + acpid;
	} else if (acpid.length === 3) {
		s = acpid;
	} else {
		throw new Error('invalid acpid');
	}
	s = '0' + s;
	return s;
}

NT.prototype.start = function(gp) {
	this.gp = gp;
};

NT.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

NT.prototype.checkTransfer = function(o, callback) {
	var acpid = o.acinfo.acpid, self = this, uname = o.player.playername + leftPadAcpid(acpid),
		gpCfg = this.gp.cfg, str;
    str = 'token=' + gpCfg.token + '&secret_key='+gpCfg.sec+'&format='+gpCfg.format;
	str += '&group_id='+gpCfg.groupid+'&user_id=' + uname + '&hash=' + o.dno;

    request({
		method: 'get',
		url: gpCfg.apiurl + gpCfg.checktransfer + '?' + str + '&__x=' + new Date().getTime(),
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			try {
				var data = JSON.parse(body), code = 0, status = 2;
				if (data.error && data.error == '11') {
					status = 1;
				} else if (data.user_id && data.user_id == uname 
					&& data.transactionID && data.transactionID == o.dno) {
					status = 0;
				}
				logger.info('[CheckTransfer] NT dno=' + o.dno + ', c=' + code + ', s=' + status);
				callback(0, {c: code, s: status});
			} catch (e) {
				logger.error('NT checkTransfer parse response error %s %s', e, body);
				callback(1414, -2);
			}
		} else {
			callback(1414, -3);
		}
	});
};

module.exports = new NT();
