var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('knbs');
var myutil = require('../util/util');
var request = require('request');
var xml2js = require('xml2js');
var config = require('../config/config');
var moment = require('moment');
var tz = require('moment-timezone'), TIMEZONE = 'GMT', DATE_PATTERN = 'ddd, DD MMM YYYY HH:mm:ss';
var SOAPBEGIN = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>';
var SOAPEND = '</soap:Body></soap:Envelope>';

function IMSport() {
	EventEmitter.call(this);
	this.jkey = 'imsports';
	this.md5hash = null;
	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: true,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});
}
util.inherits(IMSport, EventEmitter);

IMSport.prototype.start = function(gp) {
	this.gp = gp;
	this.md5hash = myutil.md5(gp.cfg.des3key);
};

IMSport.prototype.getUnsettled = function(o, callback) {
	callback(0, {gpid: this.gp.gpid, val: '0.00'});
};

IMSport.prototype.checkTransfer = function(o, callback) {
	var gpCfg = this.gp.cfg, self = this, timestamp = moment().tz(TIMEZONE).format(DATE_PATTERN) + TIMEZONE;

	timestamp = myutil.des({key: this.md5hash, alg: 'des-ede', autoPad: true, content: timestamp, hexbuff: true});

    var str = SOAPBEGIN + '<getTransferStatusXML xmlns="http://tempuri.org/"><timeStamp>'+timestamp+'</timeStamp><transferId>'+o.dno+'</transferId></getTransferStatusXML>' + SOAPEND;

    request({
		method: 'POST',
		url: gpCfg.apiUrl,
		proxy: config.proxy,
		body: str,
		headers: {
			'Charset': 'UTF-8',
			'Content-Type': 'text/xml'
		}
	}, function(error, response, body) {
		if (response && response.statusCode === 200) {
			self.xmlparser.parseString(body, function (err, result) {
				if (!err && result) {
					var rs = result['soap:Body']['getTransferStatusXMLResponse'], code, status = 2,
						b = rs.statusCode;
			        if (b == 100) { // success
			        	code = 0;
			        	if (rs.transferStatus == 'Approved') {
			        		status = 0;
			        	}
			        } else if (b == 101) {
			        	code = 2;
			        	status = -1;
			        } else {
			        	code = 1;
			        }
			        logger.info('[CheckTransfer] IMSport dno=' + o.dno + ', c=' + code + ', s=' + status);
			        callback(0, {c: code, s: status});
				} else {
					logger.error('imsport checkTransfer xml1 error %s %s', err, body);
					callback(1414, 2);
				}
		    });
		} else {
			callback(1414, 3);
		}
	});
};

module.exports = new IMSport();
