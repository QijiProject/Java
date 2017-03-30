var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    MongoMgr = require('../../comp/mongoService');
var logger = require('../../util/log4js').getLogger('wimsport');

var queOfImSportUnsettled = new Schema({
	wagerno: {type: String, index: true, unique: true},
	acpid: {type: String, index: true},
	playername: String,
	sportname: String,
	bettime: {type: Number, index: true}
});

var d = MongoMgr.getDB().model('que_imsport_unsettled', queOfImSportUnsettled, 'que_imsport_unsettled');

d.on('index', function(err) {
   if (err) logger.error('create index on que_imsport_unsettled %s', err);
});
