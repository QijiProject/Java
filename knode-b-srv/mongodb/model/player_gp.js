var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('knbs');

var playerGP = new Schema({
	playerid: {type: String, index: true},
	playername: {type: String, index: true},
	playertype: Number,
	agentcode: Number,
	gpn: {type: Number, index: true},
	gpid: {type: String, index: true},
	acpid: String,
	created: Number,
	updated: Number
});

var d = MongoMgr.getDB().model('player_gp', playerGP, 'player_gp');

d.on('index', function(err) {
   if (err) logger.error('create index on player_gp %s', err);
});
