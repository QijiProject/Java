//manualRetrievingRecordsJob

var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var momentStartTime;
const recordsDurationPerServiceCall = 15;
var webServiceCallCount = 0;
var totalCallbackExecuted = 0;
var jobId;

process.on('message', (m) => {
	momentStartTime = moment(new Date(m.startTime)).utc();
	var momentEndTime = moment(new Date(m.endTime)).utc();
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
		serviceCallEndTime = momentStartTime.clone().add(callCount * recordsDurationPerServiceCall, 'minutes').format("YYYY-MM-DD HH:mm:ss:SSS");
	} else {
		serviceCallEndTime = lastCallEndTime.format("YYYY-MM-DD HH:mm:ss:SSS");
	}
	
	var serviceCallStartTime = momentStartTime.clone().add((callCount - 1) * recordsDurationPerServiceCall, 'minutes').format("YYYY-MM-DD HH:mm:ss:SSS");
	var options = {
		uri : 'http://localhost:8080/webserviceStage3/getMemberBetDetailsByBetDatetimeJSONResponse?' + '?startTime=' + encodeURI(serviceCallStartTime) + '&endTime=' + encodeURI(serviceCallEndTime),
		method : 'GET'
	}
	console.log("uri inspect " + 'http://localhost:8080/webserviceStage3/getMemberBetDetailsByBetDatetimeJSONResponse?' + '?startTime=' + encodeURI(serviceCallStartTime) + '&endTime=' + encodeURI(serviceCallEndTime));
	//Send current data retrieve time range value back to server
	process.send({messageType: 'currentRunningProgress', startDateTime: serviceCallStartTime, endDateTime: serviceCallEndTime, jobIdentifier: jobId});
	
	//Send web service call to simulation of IM
	request(options, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var contentObj = JSON.parse(body);
			var memberBetDetailsArray = contentObj.BetDetails.MemberBetDetails;
			
			//Update mongodb
			MongoClient.connect("mongodb://localhost:27017/bae", function(err, db) {
				var collection = db.collection('bets');
				for(var index = 0; index < memberBetDetailsArray.length; index++) {
					collection.update({betId: memberBetDetailsArray[index].betId}, memberBetDetailsArray[index], {upsert: true})
				}
				
			});
			totalCallbackExecuted ++ ;
			console.log("body content " + body);
		} else  {
			
			console.log("not found");
		}
		totalCallbackExecuted ++;
		if(totalCallbackExecuted == webServiceCallCount) {
			process.send({messageType: 'overallProgress', jobIdentifier: jobId, startDateTime: serviceCallStartTime, endDateTime: serviceCallEndTime, status: 'Status: Completed'});
		}
	});
}