var logger = require('../util/log4js').getLogger('knbs');
var gpService = require('../service/gpService'), REGEX_GPID = /^(o)?\d{3,30}$/,
	REGEX_PLAYERID = /^\d{3,25}$/;

exports.getPlayerGps = function(req, res, next) {
	var player = req._mpkg_.getPlayer();
	if (!player.playername) return res.send({c: 1222, data: null});
	var acinfo = req._mpkg_.getReqInfo();
	gpService.getPlayerGps({acpid: acinfo.acpid, playername: player.playername}, function(code, data) {
		res.send({code: code, data: data});
	});
};

exports.getUnsettledBalance = function(req, res, next) {
	var gpid = req.query.gpid;
	if (!gpid || !REGEX_GPID.test(gpid)) return res.send({c: 1400, data: null});
	var player = req._mpkg_.getPlayer();
	if (!REGEX_PLAYERID.test(player.playerid) || !player.playername) return res.send({c: 1222, data: null});
	var o = {player: player, gpid: gpid, acinfo: req._mpkg_.getReqInfo()};
	gpService.getGpUserInfo(o, function(code, data) {
		res.send({code: code, data: data});
	}, 3);
};

exports.checkTransfer = function(req, res, next) {
	var gpid = req.query.gpid, dno = req.query.dno;
	if (!gpid || !REGEX_GPID.test(gpid) || !dno) return res.send({c: 1400, data: null});
	var player = req._mpkg_.getPlayer();
	if (!REGEX_PLAYERID.test(player.playerid) || !player.playername) return res.send({c: 1222, data: null});
	var o = {player: player, gpid: gpid, dno:dno, acinfo: req._mpkg_.getReqInfo()};
	gpService.getGpUserInfo(o, function(code, data) {
		res.send({code: code, data: data});
	}, 2);
};
