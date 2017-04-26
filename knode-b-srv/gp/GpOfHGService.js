var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var request = require('request');
var xml2js = require('xml2js');
var config = require('../config/config');

function HGSport() {
	EventEmitter.call(this);
	this.jkey = 'hg';
	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: true,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});
}
util.inherits(HGSport, EventEmitter);

HGSport.prototype.start = function(gp) {
	this.gp = gp;
};

HGSport.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

HGSport.prototype.checkTransfer = function(o, callback) {
	var self = this, gpCfg = this.gp.cfg;
    var str = '<?xml version="1.0" encoding="iso-8859-1"?><methodCall><methodName>CheckChange</methodName>';
    str += '<params><param><name>ChangeNumber</name><value>' + o.dno + '</value></param></params></methodCall>';
    
    request({
		method: 'POST',
		url: gpCfg.getTransferStatus,
		body: str,
		proxy: config.proxy,
		headers: {
			'Charset': 'UTF-8'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			self.xmlparser.parseString(body, function (err, result) {
				if (!err) {
					var code, status = 2, tmps, tmpv;
			        if (result && result.params && result.params.param) {
			        	code = 0;
			        	tmps = result.params.param.name;
			        	tmpv = result.params.param.value;
			        	if (tmps == 'status') {
			        		if (tmpv == '1') {
			        			status = 0;
			        		} else if (tmpv == '0') {
			        			status = 1;
			        		}
			        	} else if (tmps == 'Error' && tmpv.indexOf('编码不存') != -1) {
			        		code = 2;
			        		status = -1;
			        	}
			        } else {
			        	code = 1;
			        }
			        logger.info('[CheckTransfer] HG dno=' + o.dno + ', c=' + code + ', s=' + status);
			        callback(0, {c: code, s: status});
				} else {
					logger.error('hg checkTransfer parse error %s %s', err, body);
					callback(1414, 2);
				}
		    });
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new HGSport();
