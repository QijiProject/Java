var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterNT() {
	this.gpid = '8192446253701';
}

WaterNT.prototype.start = function(gp) {
	this.gp = gp;
};

WaterNT.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterNT.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from nt_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s Water NT getWater query %s', obj.acpid, String(e));
            callback(new Error('nt1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterNT.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterNT();

module.exports = w;
