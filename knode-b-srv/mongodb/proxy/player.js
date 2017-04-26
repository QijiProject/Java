var models = require('../model/index'),
    player = models.Player;

exports.getAll = function(callback) {
	player.find({}, callback);
};

exports.findByName = function(acpid, name, callback) {
	player.findOne({'acpid': acpid, 'playername': name}, callback);
};

exports.findById = function(acpid, playerid, callback) {
	player.findOne({'acpid': acpid, 'playerid': playerid}, callback);
};

