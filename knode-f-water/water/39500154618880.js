var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterOeeBetLd() {
	this.gpid = '39500154618880';
}

WaterOeeBetLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterOeeBetLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterOeeBetLd.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,a.gametype,sum(a.betamt) as betamt from oee_ld_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.budatesettle>='+obj.sdate+' and a.budatesettle<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';

	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterOeeBetLd getWater query %s', obj.acpid, String(e));
            callback(new Error('ld1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterOeeBetLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterOeeBetLd();

module.exports = w;
