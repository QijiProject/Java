var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var myutil = require('../util/util');
var request = require('request');
var xml2js = require('xml2js');
var config = require('../config/config');
var CURRENCY = 'CNY';

function AgLd() {
	EventEmitter.call(this);
	this.jkey = 'ag_ld';
	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: false,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});
}
util.inherits(AgLd, EventEmitter);

AgLd.prototype.start = function(gp) {
	this.gp = gp;
};

AgLd.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

AgLd.prototype.checkTransfer = function(o, callback) {
	var self = this, gpCfg = this.gp.cfg;
    var str = 'cagent='+gpCfg.cagent+'/\\\\/billno='+(gpCfg.cagent+o.dno)+'/\\\\/method=qos/\\\\/actype='+gpCfg.actype+'/\\\\/cur=' + CURRENCY;
    str = myutil.des({key: gpCfg.deskey, alg: 'des-ecb', autoPad: true, content: str});
    var key = myutil.md5(str + gpCfg.md5key);
    
    request({
		method: 'POST',
		url: gpCfg.agurl + '?params=' + str + '&key=' + key,
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			self.xmlparser.parseString(body, function (err, result) {
				if (!err) {
					var b = parseFloat(result.info||'a', 10), code, status = 2;
			        if (!isNaN(b)) {
			        	code = 0;
			        	if (b == 0 || b == 1) {
			        		status = b;
			        	} else if (b == 2) {
			        		status = 1;
			        	}
			        } else {
			        	code = 1;
			        	if (result.info == 'duplicate_transfer') status = 1;
			        	if (result.msg && result.msg.indexOf('order is not exist') != -1) {
			        		code = 2;
			        		status = -1;
			        	}
			        }
			        logger.info('[CheckTransfer] AG dno=' + o.dno + ', c=' + code + ', s=' + status);
			        callback(0, {c: code, s: status});
				} else {
					logger.error('ag_ld checkTransfer xml1 error %s %s', err, body);
					callback(1414, 2);
				}
		    });
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new AgLd();
