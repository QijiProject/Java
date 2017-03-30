var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('wimsport');

var queOfImsportParlay = new Schema({
	pid: {type: String, index: true, unique: true},
	acpid: {type: String, index: true},
	sqltext: String,
	created: {type: Number, index: true},
	stat: Number,
	takew: Number
});

var d = MongoMgr.getDB().model('que_imsport_parlay', queOfImsportParlay, 'que_imsport_parlay');

d.on('index', function(err) {
   if (err) logger.error('create index on que_imsport_parlay %s', err);
});
