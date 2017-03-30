var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('../util/log4js').getLogger('wimsport');
var request = require('request');
var GpMgr = require('../comp/gpService');
var moment = require('moment');
var myUtil = require('../util/util');
var xml2js = require('xml2js');
var gr = require('../util/gr');
var tz = require('moment-timezone'), TIMEZONE = 'GMT', PATTERN = 'YYYY-MM-DD hh:mm:ss a',
	DATE_PATTERN = 'ddd, DD MMM YYYY HH:mm:ss', GMTW = '-04:00';
var SOAPBEGIN = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>';
var SOAPEND = '</soap:Body></soap:Envelope>';

function FetchData() {
	EventEmitter.call(this);

	this.Ptag = null;

	this.des3key = '';
	this.md5hash = null;

	this.xmlparser = new xml2js.Parser({
		ignoreAttrs: true,
		explicitRoot: false,
		explicitArray: false,
		mergeAttrs: true
	});

	this.on('emitData', this._doData.bind(this));
}
util.inherits(FetchData, EventEmitter);

FetchData.prototype.init = function(Ptag) {
	this.Ptag = Ptag;
};

function unescapeXML(xml) {
	return xml.replace(/&apos;/g, "'")
               .replace(/&quot;/g, '"')
               .replace(/&gt;/g, '>')
               .replace(/&lt;/g, '<')
               .replace(/&amp;/g, '&');
}

FetchData.prototype.get = function(begin, end, playername, sportname) {
	//var cfg = GpMgr.getGp().basecfg,
	var self = this;
	var cfg = {apiUrl: 'http://keizak.sbws.imapi.net/externalapi.asmx', des3key: '2feb7a397f1ef052'};

	if (this.des3key != cfg.des3key) {
		this.des3key = cfg.des3key;
		this.md5hash = myUtil.md5(this.des3key);
	}
	var starttime = moment(begin).utcOffset(GMTW).format(PATTERN),
		endtime = moment(end).utcOffset(GMTW).format(PATTERN),
		timestamp = moment().tz(TIMEZONE).format(DATE_PATTERN) + TIMEZONE;
		console.log('key ' + this.des3key);
	timestamp = myUtil.des({key: this.md5hash, alg: 'des-ede', autoPad: true, content: timestamp, hexbuff: true});

	var str = '<getMemberBetDetailsByBetDatetimeLangXML xmlns="http://tempuri.org/"><timeStamp>'+timestamp+'</timeStamp>';
	str += '<memberCode>'+playername+'</memberCode><sportsName>'+sportname+'</sportsName>';
	str += '<startDate>'+starttime+'</startDate><endDate>'+endtime+'</endDate><isSettled></isSettled><lastUpdated></lastUpdated><language>CHS</language></getMemberBetDetailsByBetDatetimeLangXML>';

	console.log('startDate ' + starttime); console.log('endDate ' + endtime);
    request({
		method: 'POST',
		url: cfg.apiUrl,
		body: SOAPBEGIN + str + SOAPEND,
		timeout: 60000,
		headers: {
			'Charset': 'UTF-8',
			'Content-Type': 'text/xml'
		}
	}, function(error, response, body) {
		self.emit('emitData', error, response, body);
	});
};

FetchData.prototype._doData = function(err, response, body) {
	var strErr = '';
	if (err) {
		strErr = String(err);
		logger.error('fetch error', strErr);
		this.nextReq(false, strErr);
	} else if (response && response.statusCode === 200) {console.log(200);
		var self = this, data = null, statCode = null;
		body = unescapeXML(body);
		this.xmlparser.parseString(body, function (errx, result) {
			if (errx) {
				strErr = String(errx);
				logger.error('parse fetch error', strErr);
				self.nextReq(false, strErr);
			} else if (result && result['soap:Body'] && (data=result['soap:Body']['getMemberBetDetailsByBetDatetimeLangXMLResponse'])) {
				statCode = data.statusCode;
				if (statCode == 100) {console.log(100);
					var ret = [];
					if (data.dataSet && data.dataSet.BetDetails) {
						ret = data.dataSet.BetDetails.MemberBetDetails;
					}
					self.Ptag && self.Ptag.emit('emitData', gr.isArray(ret) ? ret : [ret]);
				} else if (statCode == 104) {console.log(104);
					self.nextReq(true, '');
				// } else if (statCode = 101) { // invalid member code

				// } else if (statCode == 102 || statCode == 103) { // invalid date

				} else {console.log('statusCode ' + statCode);
					self.nextReq(false, 'statusCode: ' + statCode);
				}
			} else {console.log('invalid xml response');
	        	self.nextReq(false, 'invalid xml response');
	        }
	    });
	} else {
		if (response) strErr = response.statusCode;
		this.nextReq(false, strErr);
	}
};

FetchData.prototype.nextReq = function(r, msg) {
	this.Ptag && this.Ptag.emit('nextReq', r, msg);
};

module.exports = FetchData;
