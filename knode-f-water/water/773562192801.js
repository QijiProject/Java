var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterTGPLd() {
	this.gpid = '773562192801';
}

WaterTGPLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterTGPLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterTGPLd.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamt) as betamt from tgp_ld_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterTGPLd getWater query %s', obj.acpid, String(e));
            callback(new Error('WaterTGPLd1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterTGPLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterTGPLd();

module.exports = w;
