//manualRetrievingRecordsJob

var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var timestampGenerator = require('./timestampGenerator.js');
var jsonxml = require('jsontoxml');
var xml2json = require('xml2json');
var XML = require('node-jsxml').XML;

var momentStartTime;
var momentEndTime;
const recordsDurationPerServiceCall = 15;
var webServiceCallCount = 0;
var totalCallbackExecuted = 0;
var jobId;
var fs = require('fs');

process.on('message', (m) => {
	momentStartTime = moment(new Date(m.startTime)).utc();
	momentEndTime = moment(new Date(m.endTime)).utc();
	var duration = moment.duration(momentEndTime.diff(momentStartTime));
	var minutesDuration = duration.asMinutes();

	jobId = m.jobId;
	
	if(minutesDuration < recordsDurationPerServiceCall) {
		webServiceCallCount = 1;
	} else {
		webServiceCallCount = minutesDuration / recordsDurationPerServiceCall;
		
		if(minutesDuration % recordsDurationPerServiceCall > 0) {
			webServiceCallCount ++ ;
		}
	}
	
	for(var callCount = 1; callCount <= webServiceCallCount; callCount++ ) {
		if(callCount != webServiceCallCount) {
			callWebServiceFromIM(callCount);
		} else {
			callWebServiceFromIM(callCount, momentEndTime);
		}
		
	}
});

function callWebServiceFromIM(callCount, lastCallEndTime) {
	var request = require('request');
	var serviceCallEndTime;
	if(!lastCallEndTime) {
		serviceCallEndTime = momentStartTime.clone().add(callCount * recordsDurationPerServiceCall, 'minutes').format("YYYY-MM-DD HH:mm:ss");
	} else {
		serviceCallEndTime = lastCallEndTime.format("YYYY-MM-DD HH:mm:ss");
	}
	
	var serviceCallStartTime = momentStartTime.clone().add((callCount - 1) * recordsDurationPerServiceCall, 'minutes').format("YYYY-MM-DD HH:mm:ss");
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
			entity.startDate = serviceCallStartTime;
			entity.endDate = serviceCallEndTime;
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
			//console.log(xmlBody);
			return xmlBody;
		})()
	}
	//Send current data retrieve time range value back to server
	process.send({messageType: 'currentRunningProgress', startDateTime: serviceCallStartTime, endDateTime: serviceCallEndTime, jobIdentifier: jobId});
	
	//Send web service call to simulation of IM
	
	request(options, function(error, response, body) {
		var responseDataJson;
		if(!error && response.statusCode == 200) {
			var responseXMLContent = new XML(body);
			if(responseXMLContent.descendants('statusCode') == 100) {
				console.log('100');
				
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
				appendError(serviceCallStartTime, serviceCallStartTime, responseXMLContent.descendants('statusDesc'));
			}
		} else  {
			appendError(serviceCallStartTime, serviceCallStartTime, "Bad response code: " + response.statusCode);
		}
		totalCallbackExecuted ++;
		if(totalCallbackExecuted == webServiceCallCount) {
			process.send({messageType: 'overallProgress', jobIdentifier: jobId, startDateTime: serviceCallStartTime, endDateTime: serviceCallEndTime, status: 'Status: Completed'});
		}
	});
}

function appendError(startTime, endTime, errorMessage) {
	var timeRange = "[" + startTime + " - " + endTime + "]";
	fs.appendFile("manual-error.log", timeRange + ' ' +  result, function(err) {
		if(err) {
			console.log(err);
		}
	});
}