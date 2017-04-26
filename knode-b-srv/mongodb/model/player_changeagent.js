var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('knbs');

var playercg = new Schema({
	id: {type: Number, index: true},
	acpid: {type: String, index: true},
	playerid: {type: String, index: true},
	fromagt: Number,
	toagt: Number,
	status: Number,
	created: {type: Number, index: true},
	updated: Number
});

var d = MongoMgr.getDB().model('player_changeagent', playercg, 'player_changeagent');

d.on('index', function(err) {
   if (err) logger.error('create index on player_changeagent %s', err);
});
