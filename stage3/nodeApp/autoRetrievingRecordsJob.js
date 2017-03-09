//autoRetrievingRecordsJob

var MongoClient = require('mongodb').MongoClient;
var jobId;

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
	var startDateTimeFormatted = endDateTimeWrapper.clone().subtract(15, "minutes").format("YYYY-MM-DD HH:mm:ss:SSS");
	var endDateTimeFormatted = endDateTimeWrapper.format("YYYY-MM-DD HH:mm:ss:SSS");
	
	//Send current data retrieve time range value back to server
	process.send({messageType: 'currentRunningProgress', startDateTime: startDateTimeFormatted, endDateTime: endDateTimeFormatted, jobIdentifier: jobId});
	var request = require('request');
	
	var options = {
		uri : 'http://localhost:8080/webserviceStage3/getMemberBetDetailsByBetDatetimeJSONResponse',
		method : 'GET'
	}
	
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
			
			console.log("body content " + body);
		} else  {
			console.log("not found");
		}
	});
	
}


	