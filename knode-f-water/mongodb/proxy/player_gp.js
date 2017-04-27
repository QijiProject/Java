var models = require('../model/index'),
    playerGP = models.PlayerGp;

exports.getPlayerGps = function(t, callback) {
	playerGP.find({'updated': {$gte: t}}, {_id: 0,
	 playername:0, playertype:0, agentcode:0, created:0}, callback);
};

exports.getPlayerGpsById = function(acpid, playerid, callback) {
	playerGP.find({'acpid': acpid, 'playerid': playerid}, callback);
};