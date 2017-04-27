var logger = require('../util/log4js').getLogger('kfwater');
var waterService = require('../service/waterService');
var NUMREGEX = /^[0-9]{10}$/, bline = 1427817600;

exports.sumByDate = function(req, res, next) {
	var sdate = req.params.date, edate = req.query.edate;
	if (!edate) edate = parseInt(new Date().getTime() / 1000, 10);
	if (!sdate || !NUMREGEX.test(sdate) || sdate < bline || !edate || !NUMREGEX.test(edate))
		 return res.send({'ok': 0, 'data': 'invalid params'});
	var playerid = req._mpkg_.getPlayerId(), reqinfo = req._mpkg_.getReqInfo();

	waterService.playerWater({acpid: reqinfo.acpid, uid: playerid, sdate: sdate, edate: edate}, function(err, rs) {
		res.send({"ok": err !== null ? 0 : 1, "data": rs});
	});
};
