var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterKG() {
	this.gpid = '520723134101';
}

WaterKG.prototype.start = function(gp) {
	this.gp = gp;
};

WaterKG.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterKG.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.validbetamount) as betamt from kg_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterKG getWater query %s', obj.acpid, String(e));
            callback(new Error('kg1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterKG.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterKG();

module.exports = w;
