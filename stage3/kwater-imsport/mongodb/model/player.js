var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('wimsport');

var player = new Schema({
	playerid: {type: String, index: true},
	playername: {type: String, index: true},
	playertype: {type: Number, index: true},
	agentcode: {type: Number, index: true},
	gpn: {type: Number, index: true},
	acpid: {type: String, index: true},
	created: Number,
	updated: Number
});

var d = MongoMgr.getDB().model('player', player, 'player');

d.on('index', function(err) {
   if (err) logger.error('create index on player %s', err);
});
