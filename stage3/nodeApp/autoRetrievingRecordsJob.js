//autoRetrievingRecordsJob

var MongoClient = require('mongodb').MongoClient;
var jsonxml = require('jsontoxml');
var timestampGenerator = require('./timestampGenerator.js');
var jsonxml = require('jsontoxml');
var xml2json = require('xml2json');
var XML = require('node-jsxml').XML;
var jobId;
var fs = require('fs');

process.on('message', (m) => {
	console.log("auto running job started!");
	jobId = m.jobId;
	var endDateTime = new Date(m.currentDateTime);
	callWebServiceFromIM(endDateTime);
	setInterval(function() {
		callWebServiceFromIM(new Date());
	}, 600000); //Trigger every 10 minutes
});
	


// call web service
function callWebServiceFromIM(endDateTime) {
	var moment = require('moment');
	var endDateTimeWrapper = moment(endDateTime);
	
	// Get time 15 minutes earlier from endDateTime
	var startDateTimeFormatted = endDateTimeWrapper.clone().subtract(15, "minutes").format("YYYY-MM-DD HH:mm:ss");
	var endDateTimeFormatted = endDateTimeWrapper.format("YYYY-MM-DD HH:mm:ss");
	
	//Send current data retrieve time range value back to server
	process.send({messageType: 'currentRunningProgress', startDateTime: startDateTimeFormatted, endDateTime: endDateTimeFormatted, jobIdentifier: jobId});
	var request = require('request');
	
	var options = {
		uri : 'http://keizak.sbws.imapi.net/externalapi.asmx',
		method : 'POST',
		headers: {
			'Content-Type': 'text/xml; charset=UTF-8',
			'SOAPAction': 'http://tempuri.org/getMemberBetDetailsByBetDatetimeXML'
		},
		body: (function() {
			var entity = {};
			entity.timeStamp = timestampGenerator.generate();
			entity.memberCode = '';
			entity.sportsName = '';
			entity.startDate = startDateTimeFormatted;
			entity.endDate = endDateTimeFormatted;
			entity.isSettled = '';
			entity.lastUpdated = '';
			var xmlBody = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
			"<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
			"<soap:Body>" + 
			"<getMemberBetDetailsByBetDatetimeXML xmlns=\"http://tempuri.org/\">" + 
			jsonxml(entity) + 
			"</getMemberBetDetailsByBetDatetimeXML>" + 
			"</soap:Body>" +
			"</soap:Envelope>"
			console.log(xmlBody);
			return xmlBody;
		})()
	};
	
	//Send web service call to simulation of IM
	(function(startDateTime, endDateTime, options) {
	request(options, function(error, response, body) {
		var responseDataJson;
		if(!error && response.statusCode == 200) {
			var responseXMLContent = new XML(body);
			if(responseXMLContent.descendants('statusCode') == 100) {
				
				var dataSet = responseXMLContent.descendants('dataSet').toString();

				var dataSetJson;
					
				if(dataSet) {
					dataSetJson = JSON.parse(xml2json.toJson(dataSet, {sanitize: true}));
				}
				
				if(dataSetJson && dataSetJson.BetDetails) {
					var memberBetDetailsArray = dataSetJson.BetDetails.MemberBetDetails;
					console.log(dataSetJson);
					MongoClient.connect("mongodb://localhost:27017/bae", function(err, db) {
						if(!err) {
							var collection = db.collection('bets');
							for(var index = 0; index < memberBetDetailsArray.length; index++) {
								if(memberBetDetailsArray[index] && memberBetDetailsArray[index].ParlayBetDetails) {
									var parlayBetDetailsArray = memberBetDetailsArray[index].ParlayBetDetails;

									for(var parlayBetCount = 0; parlayBetCount < parlayBetDetailsArray.length; parlayBetCount++) {
										var parlaySign = parlayBetDetailsArray[parlayBetCount].ParlaySign;
										if(parlaySign && parlaySign.hasOwnProperty('$t')) {
											delete parlaySign['$t'];
										}
										
									}
								}
								collection.update({betId: memberBetDetailsArray[index].betId}, memberBetDetailsArray[index], {upsert: true}, function(err, result) {
									if(err) {
										console.log(err);
										appendError(serviceCallStartTime, serviceCallEndTime, result);
									} else {
										console.log('successful result ' + result);
									}
								});
							}
						}
					
						db.close();
					});	
				}	
				
			} else {
				appendError(startDateTime, endDateTime, responseXMLContent.descendants('statusDesc'));
			}
		} else  {
			appendError(startDateTime, endDateTime, "Bad response code: " + response.statusCode);
		}
	});
	})(startDateTimeFormatted, endDateTimeFormatted, options);
	
}

function appendError(startTime, endTime, errorMessage) {
	var timeRange = "[" + startTime + " - " + endTime + "]";
	fs.appendFile("auto-error.log", timeRange + ' ' +  errorMessage, function(err) {
		if(err) {
			console.log(err);
		}
	});
}


	