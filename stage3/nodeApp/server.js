var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const cp = require('child_process');
var http = require('http');
var cookieParser = require('cookie-parser');
var clientIdVsInstanceMap = {};
var jobIdVsSocket = {};

var server = http.createServer(app);
var ws = require('socket.io')(server);

app.use(cookieParser());
app.use(express.static(__dirname + '/view'));
app.use(bodyParser.json());
app.use(function(req, res, next){
	if(!req.cookies.clientId) {
		var clientId = new Date().getTime();
		req.cookies.clientId = clientId;
		res.cookie('clientId', clientId, {maxAge: 900000, httpOnly: true});
	}
	next();
});
//Home page url mapping
app.get('/', function(req, res) {
	res.sendFile('index.html');
});

//Trigger auto data retrieval job
app.post('/startRetrieveRecordsJob', function(req, res){
	var dateTime = require('node-datetime');
	var dt = dateTime.create();
	var formattedCurrentDateTime = dt.format('Y-m-d H:M:S:N');
	var autoJob = cp.fork(`${__dirname}/autoRetrievingRecordsJob.js`);
	var clientId;
	
	//Receive currently running time range
	autoJob.on('message', (m) => {
		if(m.messageType == 'currentRunningProgress') {
			updateCurrentJobProgress('autoProgress', m.jobIdentifier, m.startDateTime, m.endDateTime);
		}
	});
	
	//Send information to job process
	autoJob.send({currentDateTime: formattedCurrentDateTime, jobId: req.body.jobId});
	
	if(req.cookies && req.cookies.clientId) {
		clientId = req.cookies.clientId;
	}

	insertClientJobInstance(clientId, 'autoJob', autoJob, req.body.jobId);
	res.end(JSON.stringify({startDateTime : formattedCurrentDateTime}));
	
});

function updateCurrentJobProgress(messageType, jobIdentifier, currentStartTime, currentEndTime) {
	var socket = jobIdVsSocket[jobIdentifier];
	socket.emit(messageType, {currentStartProgress: currentStartTime, currentEndProgress: currentEndTime});
}

function insertClientJobInstance(clientId, type, value, jobId) {
	var instance = clientIdVsInstanceMap[clientId];
	
	if(instance) {
		instance[type] = {job: value, jobId: jobId};
	} else {
		var newInstance = {};
		newInstance[type] = {job: value, jobId: jobId};
		clientIdVsInstanceMap[clientId] = newInstance;
	}
}


function getJobClientInstance(clientId, type) {
	var instance = clientIdVsInstanceMap[clientId];
	return instance[type].job;
}


//Kill autoJobProcess
app.post('/abortJob', function(req, res){
	var dateTime = require('node-datetime');
	var dt = dateTime.create();
	var formattedCurrentDateTime = dt.format('Y-m-d H:M:S:N');
	
	console.log("Aborting job " + req.cookies.clientId);
	
	getClientJobInstance(req.cookies.clientId, 'autoJob').kill('SIGINT');
	
	//Get job id and clear mapping on abort
	var jobId = clientIdVsInstanceMap[req.cookies.clientId]['autoJob'].jobId;
	clearJobIdVsSocketMapping(jobId);
	
	res.end(JSON.stringify({endDateTime : formattedCurrentDateTime}));
	console.log("Job aborted");
});

//Kill manual job process
app.post('/abortManualJob', function(req, res){
	var dateTime = require('node-datetime');
	var dt = dateTime.create();
	var formattedCurrentDateTime = dt.format('Y-m-d H:M:S:N');
	var jobId = clientIdVsInstanceMap[req.cookies.clientId]['manualJob'].jobId;
	
	console.log("Aborting job");
	getClientJobInstance(req.cookies.clientId, 'manualJob').kill('SIGINT');
	
	//Clear mapping record
	clearJobIdVsSocketMapping(jobId);
	res.end(JSON.stringify({endDateTime : formattedCurrentDateTime}));
	console.log("Job aborted");
	
});

//Trigger manual data retrieval job
app.post('/startManualRetrieveRecordsJob', function(req, res){
	var manualJob = cp.fork(`${__dirname}/manualRetrievingRecordsJob.js`);
	
	//Receive currently running time range
	manualJob.on('message', (m) => {
		if(m.messageType == 'currentRunningProgress') {
			updateCurrentJobProgress('manualProgress', m.jobIdentifier, m.startDateTime, m.endDateTime);
		}
		//Overall manual job status update
		else if(m.messageType == 'overallProgress') {
			var socket = jobIdVsSocket[m.jobIdentifier];
			socket.emit('manualOverallProgress', {status: m.status});
			
			//If job completed then clear job vs socket mapping
			if(m.status == 'Status: Completed') {
				clearJobIdVsSocketMapping(m.jobIdentifier);
			}
		}	
	});
	
	//Send information to manual job
	manualJob.send({startTime: req.body.manualStartTime, endTime: req.body.manualEndTime, jobId: req.body.jobId});
	insertClientJobInstance(req.cookies.clientId, 'manualJob', manualJob);
	res.end(JSON.stringify({status : 'success'}));
	
});


//Web socket listen for connection
ws.on('connection', function(socket){
	socket.on('addNewJob', function(message){
		console.log('Adding new job ' + message.jobId);
		jobIdVsSocket[message.jobId] = socket;
	});
	
	socket.on('disconnect', function(m){
		console.log('disconnecting socket');
		socket.disconnect();
	});
	
	socket.on('clearClientId', function(m){
		console.log('clearing client id record');
		var cookie = socket.request.headers.cookie;
		if(cookie && cookie.clientId) {
			console.log('clear client id record for ' + cookie.clientId);
			delete clientIdVsInstanceMap[cookie.clientId];
		}
	});
});


//Start listening on port 8081
server.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});

function clearJobIdVsSocketMapping(jobId) {
	delete jobIdVsSocket[jobId];
	console.log('Job Vs Socket mapping is cleared');
}

