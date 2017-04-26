var logger = require('../util/log4js').getLogger('knbs');
var waterService = require('../service/waterService');
var NUMREGEX = /^[0-9]{10}$/, bline = 1427817600, NUMREGEX1 = /^[0-9]{4,25}$/;

exports.sumByDate = function(req, res, next) {
	var uid = req.params.uid, sdate = req.params.date, edate = req.query.edate;
	if (!edate) edate = parseInt(new Date().getTime() / 1000, 10);
	if (!uid || !NUMREGEX1.test(uid) || !sdate || !NUMREGEX.test(sdate) || sdate < bline || !edate || !NUMREGEX.test(edate))
		 return res.send({'ok': 0, 'data': 'invalid params'});
	var acinfo = req._mpkg_.getReqInfo();
	waterService.playerWater({acpid: acinfo.acpid, uid: uid, sdate: sdate, edate: edate}, function(err, rs) {
		res.send({"ok": err !== null ? 0 : 1, "data": rs});
	});
};

exports.sumOfAgentByDate = function(req, res, next) {
	var acode = req.params.agentcode, sdate = req.params.date, edate = new Date().getTime() / 1000;
	if (!acode || !sdate) return res.send({'ok': 0, 'data': 'invalid params'});
	var acinfo = req._mpkg_.getReqInfo();
	waterService.agentWater({acpid: acinfo.acpid, agentcode: acode, sdate: sdate, edate: edate}, function(err, rs) {
		res.send({"ok": err !== null ? 0 : 1, "data": rs});
	});
};
