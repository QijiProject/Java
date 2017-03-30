var models = require('../model/index'),
    queOfImSportUnsettled = models.QueOfImSportUnsettled;

exports.getAll = function(callback) {
	queOfImSportUnsettled.find({}, callback);
};

exports.del = function(wagerno, callback) {
	queOfImSportUnsettled.findOneAndRemove({wagerno: wagerno}, callback);
};

exports.update = function(wagerno, acpid, playername, sportname, bettime, callback) { 
	queOfImSportUnsettled.findOneAndUpdate({'wagerno': wagerno}, 
		{wagerno: wagerno, acpid: acpid, playername: playername,
		 sportname: sportname, bettime: bettime}, {upsert: true}, callback);
};