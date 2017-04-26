var models = require('../model/index'),
    playerChangeAgent = models.PlayerChangeAgent;

exports.createChangeRecord = function(cg, callback) {
	var data = {
		id: cg.id,
		acpid: cg.acpid,
		playerid: cg.playerid,
		fromagt: cg.fromagt,
		toagt: cg.toagt,
		status: 1,
		created: cg.created,
		updated: cg.updated
	};
	playerChangeAgent.findOne({'acpid': data.acpid, 'playerid': data.playerid, 'id': data.id}, function(err, doc) {
		if (err) {
			callback(err, 1);
		} else if (!doc) { // new
			playerChangeAgent.findOneAndUpdate({'acpid': data.acpid, 'playerid': data.playerid, 'id': data.id}, 
				data, {new: true, upsert: true}, callback);
		} else {
			callback(null, doc);
		}
	});	
};
