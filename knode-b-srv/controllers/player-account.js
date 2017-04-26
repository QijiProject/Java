var logger = require('../util/log4js').getLogger('knbs');
var pacService = require('../service/playerService'), REGEX_PLAYERID = /^\d{3,25}$/, REGEX_ID = /^\d{1,15}$/;

exports.getMcBalance = function(req, res, next) {
	var player = req._mpkg_.getPlayer();
	if (!REGEX_PLAYERID.test(player.playerid)) return res.send({c: 1222, data: null});
	pacService.getMcBalance({playerid: player.playerid, acinfo: req._mpkg_.getReqInfo()}, function(code, data) {
		res.send({code: code, data: data});
	});
};

exports.getPlayerTransferGps = function(req, res, next) {
	var player = req._mpkg_.getPlayer();
	if (!REGEX_PLAYERID.test(player.playerid)) return res.send({c: 1222, data: null});
	pacService.getPlayerTransferGps({playerid: player.playerid, 
		acinfo: req._mpkg_.getReqInfo()}, function(code, data) {
		res.send({code: code, data: data});
	});
};

exports.changePlayerAgent = function(req, res, next) {
	var id = req.query.id;
	if (!id || !REGEX_ID.test(id)) return res.send({c: 1400, data: null});
	pacService.changePlayerAgent({id: id, acinfo: req._mpkg_.getReqInfo()}, function(code, data) {
		res.send({code: code, data: data});
	});
};
