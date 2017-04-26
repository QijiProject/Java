var models = require('../model/index'),
    playerGP = models.PlayerGp;

exports.getPlayerGps = function(acpid, name, callback) {
	playerGP.find({'acpid': acpid, 'playername': name}, callback);
};

exports.getPlayerGpsById = function(acpid, playerid, callback) {
	playerGP.find({'acpid': acpid, 'playerid': playerid}, callback);
};

exports.checkPlayerJoinGp = function(acpid, playerid, gpid, callback) {
	playerGP.findOne({'acpid': acpid, 'playerid': playerid, 'gpid': gpid}, callback);
};