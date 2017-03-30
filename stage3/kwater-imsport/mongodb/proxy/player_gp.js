var models = require('../model/index'),
    playerGP = models.PlayerGp;

exports.getAll = function(callback) {
	playerGP.find({}, callback);
};

exports.getListByGp = function(gpid, callback) {
	playerGP.find({'gpid': gpid}, callback);
};

exports.getListByGpByCreated = function(gpid, dt, callback) {
	playerGP.find({'gpid': gpid, 'created': {'$gte': dt}}, callback);
};

exports.findByName = function(acpid, name, callback) {
	playerGP.findOne({'acpid': acpid, 'playername': name}, callback);
};

exports.updateGp = function(user, gpid, callback) {
	var data = {
		playerid: user.playerid,
		playername: user.playername,
		playertype: user.playertype,
		agentcode: user.agentcode,
		gpn: user.gpn,
		gpid: gpid,
		acpid: user.acpid,
		created: user.created,
		updated: user.updated
	};
	playerGP.findOneAndUpdate({'acpid': user.acpid, 'playername': user.playername, 'gpid': gpid},
	 data, {upsert: true}, callback);
};