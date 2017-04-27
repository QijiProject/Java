var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterOeeBetSB() {
	this.gpid = '62207692669952';
}

WaterOeeBetSB.prototype.start = function(gp) {
	this.gp = gp;
};

WaterOeeBetSB.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterOeeBetSB.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from oee_sportsbook_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.created>='+obj.sdate+' and a.created<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterOeeBetSB getWater query %s', obj.acpid, String(e));
            callback(new Error('sb1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterOeeBetSB.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterOeeBetSB();

module.exports = w;
