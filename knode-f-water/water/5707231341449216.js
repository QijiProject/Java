var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterKeno() {
	this.gpid = '5707231341449216';
}

WaterKeno.prototype.start = function(gp) {
	this.gp = gp;
};

WaterKeno.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterKeno.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,a.matcharea,sum(a.betmoney) as betamt from keno_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.matcharea';

	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterKeno getWater query %s', obj.acpid, String(e));
            callback(new Error('keno1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterKeno.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterKeno();

module.exports = w;
