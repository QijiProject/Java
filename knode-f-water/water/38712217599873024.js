var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterAgld() {
	this.gpid = '38712217599873024';
}

WaterAgld.prototype.start = function(gp) {
	this.gp = gp;
};

WaterAgld.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterAgld.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,a.gametype,sum(a.validbetamount) as betamt from ag_ld_wagered a';
	sql += ' where a.status=1 and a.flag=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';

	var self = this, gpname = obj._gpname;
	connection.query(sql, function(e, rows) {
		if (e) {
			logger.error('mysql getconnection on %s WaterAgld getWater query %s', obj.acpid, String(e));
			callback(new Error('ag1'), self.empty(gpname));
		} else {
			if (rows.length == 1 && !rows[0]['playerid']) rows = [];
			callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
		}
	});
};

WaterAgld.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterAgld();

module.exports = w;
