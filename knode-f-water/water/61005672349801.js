var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterNOeeBetSB() {
	this.gpid = '61005672349801';
}

WaterNOeeBetSB.prototype.start = function(gp) {
	this.gp = gp;
};

WaterNOeeBetSB.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterNOeeBetSB.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from noee_sportsbook_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.created>='+obj.sdate+' and a.created<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterNOeeBetSB getWater query %s', obj.acpid, String(e));
            callback(new Error('nsb1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterNOeeBetSB.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterNOeeBetSB();

module.exports = w;
