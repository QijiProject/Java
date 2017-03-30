var myUtil = require('./util/util');
var request = require('request');
var xml2js = require('xml2js');
var moment = require('moment');
var tz = require('moment-timezone'), TIMEZONE = 'GMT', PATTERN = 'YYYY-MM-DD hh:mm:ss a',
	DATE_PATTERN = 'ddd, DD MMM YYYY HH:mm:ss', GMTW = '-04:00';
var SOAPBEGIN = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>';
var SOAPEND = '</soap:Body></soap:Envelope>';

var xmlparser = new xml2js.Parser({
	ignoreAttrs: true,
	explicitRoot: false,
	explicitArray: false,
	mergeAttrs: true
});

function unescapeXML(xml) {
	return xml.replace(/&apos;/g, "'")
               .replace(/&quot;/g, '"')
               .replace(/&gt;/g, '>')
               .replace(/&lt;/g, '<')
               .replace(/&amp;/g, '&');
}

var d = moment().utcOffset(0).format('YYYY-MM-DD hh:mm:ss a');

function get(begin, end, playername, sportname) {
	var cfg = {"des3key":"2feb7a397f1ef052", "lang":"chs", "apiUrl":"http://keizak.sbws.imapi.net/externalapi.asmx"};

	var starttime = moment(begin).utcOffset(GMTW).format(PATTERN),
		endtime = moment(end).utcOffset(GMTW).format(PATTERN),
		timestamp = moment().tz(TIMEZONE).format(DATE_PATTERN) + TIMEZONE;
	
	timestamp = myUtil.des({key: myUtil.md5(cfg.des3key), alg: 'des-ede', autoPad: true, content: timestamp, hexbuff: true});
 
	var str = '<getMemberBetDetailsByBetDatetimeLangXML xmlns="http://tempuri.org/"><timeStamp>'+timestamp+'</timeStamp>';
	str += '<memberCode>'+playername+'</memberCode><sportsName>'+sportname+'</sportsName>';
	str += '<startDate>'+starttime+'</startDate><endDate>'+endtime+'</endDate><isSettled></isSettled><lastUpdated></lastUpdated><language>CHS</language></getMemberBetDetailsByBetDatetimeLangXML>';
    console.log(str)
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
		var s = unescapeXML(body);
		console.log(s)
		parseXML(s);
	});
}

function parseXML(body) {
	xmlparser.parseString(body, function (errx, result) {
		var data = null, statCode = null;
		if (errx) {
			console.log(errx)
		} else if (result && result['soap:Body'] && (data=result['soap:Body']['getMemberBetDetailsByBetDatetimeLangXMLResponse'])) {
			statCode = data.statusCode;
			if (statCode == 100) {
				var ret = [];
				if (data.dataSet && data.dataSet.BetDetails) {
					ret = data.dataSet.BetDetails.MemberBetDetails;
				}
				console.log(ret);
			} else if (statCode == 104) {
				console.log('ok')
			} else {
				console.log(statCode + ' : ' + data.statusDesc)
			}
        } else {
        	console.log('invalid xml response');
        }
    });
}

function testtt() {
	var t = moment('2015-12-25T04:48:18.603-04:00');
	console.log(t.unix());
	t = t.tz('Asia/Shanghai');
	console.log(t.format('YYYY-MM-DD HH:mm:ss'));
}

function testXML() {
	var xml = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><getMemberBetDetailsByBetDatetimeLangXMLResponse xmlns="http://tempuri.org/"><dataSet>';
	xml += '<BetDetails>';
	xml += '<MemberBetDetails>';
	xml += '<betId>123345</betId>';
	xml += '<sportsName>score</sportsName>';
	xml += '<ParlayBetDetails>';
	xml += '<ParlaySign>12</ParlaySign>';
	xml += '</ParlayBetDetails>';
	xml += '<ParlayBetDetails>';
	xml += '<ParlaySign>12</ParlaySign>';
	xml += '</ParlayBetDetails>';
	xml += '</MemberBetDetails>';
	xml += '<MemberBetDetails>';
	xml += '<betId>333423</betId>';
	xml += '<sportsName>basket</sportsName>';
	xml += '<HTHomeScore></HTHomeScore>';
	xml += '</MemberBetDetails>';
	xml += '</BetDetails>';
	xml += '</dataSet><statusCode>100</statusCode><statusDesc>Success</statusDesc></getMemberBetDetailsByBetDatetimeLangXMLResponse></soap:Body></soap:Envelope>';
	xmlparser.parseString(xml, function (errx, result) {
		console.log(result);
		var data = result['soap:Body']['getMemberBetDetailsByBetDatetimeLangXMLResponse']
		if (data.dataSet) {
			console.log(data.dataSet)
			var detail = data.dataSet.BetDetails.MemberBetDetails;
			console.log(detail)
		}
	});
}

setTimeout(function() {
	// console.log(new Date(1451501217000))
	var d = moment(1466131796000)
		t = d.format('YYYY-MM-DD HH:mm:ss'),
		t1 = d.add(1,'s').format('YYYY-MM-DD HH:mm:ss');
	get(t, t1, 'px8878080a11', 'Soccer');
	// testtt();
	// testXML()
}, 1000);

