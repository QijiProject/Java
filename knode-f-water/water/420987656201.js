var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterPtLd() {
	this.gpid = '420987656201';
}

WaterPtLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterPtLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterPtLd.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from npt_ld_wagered_detail a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
     connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterNewPtLd getWater query %s', obj.acpid, String(e));
            callback(new Error('nptld1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterPtLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterPtLd();

module.exports = w;
