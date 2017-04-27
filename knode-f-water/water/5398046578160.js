var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterImSport() {
	this.gpid = '5398046578160';
}

WaterImSport.prototype.start = function(gp) {
	this.gp = gp;
};

WaterImSport.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterImSport.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamt) as betamt from imsport_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.transtime>='+obj.sdate+' and a.transtime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterImSport getWater query %s', obj.acpid, String(e));
            callback(new Error('imsport1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterImSport.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterImSport();

module.exports = w;
