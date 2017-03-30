var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('wimsport');

var queOfImSport = new Schema({
	wagerno: {type: String, index: true, unique: true},
	acpid: {type: String, index: true},
	playerid: {type: String, index: true},
	playername: String,
	sqltext: String,
	created: {type: Number, index: true},
	stat: Number,
	takew: Number
});

var d = MongoMgr.getDB().model('que_imsport', queOfImSport, 'que_imsport');

d.on('index', function(err) {
   if (err) logger.error('create index on que_imsport %s', err);
});
