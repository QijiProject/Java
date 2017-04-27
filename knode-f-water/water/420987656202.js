var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterPtRegular() {
	this.gpid = '420987656202';
}

WaterPtRegular.prototype.start = function(gp) {
	this.gp = gp;
};

WaterPtRegular.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterPtRegular.prototype.getWater = function(connection, callback, obj, cond) { // realmoneybets
	var sql = 'select a.playerid,sum(a.betamount) as betamt from npt_regular_wagered_detail a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterNewPtRegular getWater query %s', obj.acpid, String(e));
            callback(new Error('nptr1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterPtRegular.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterPtRegular();

module.exports = w;
