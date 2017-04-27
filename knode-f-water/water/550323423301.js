var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterIMOPtr() {
	this.gpid = '550323423301';
}

WaterIMOPtr.prototype.start = function(gp) {
	this.gp = gp;
};

WaterIMOPtr.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterIMOPtr.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.totalbetamt) as betamt from imo_ptr_wagered a';
	sql += ' where a.tesing=0 and a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterIMOPtr getWater query %s', obj.acpid, String(e));
            callback(new Error('WaterIMOPtr1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterIMOPtr.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterIMOPtr();

module.exports = w;
