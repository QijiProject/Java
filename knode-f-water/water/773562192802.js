var logger = require('../util/log4js').getLogger('kfwater');
var DbMgr = require('../comp/dbService');

function WaterTGPSlot() {
	this.gpid = '773562192802';
}

WaterTGPSlot.prototype.start = function(gp) {
	this.gp = gp;
};

WaterTGPSlot.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterTGPSlot.prototype.getWater = function(connection, callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamt) as betamt from tgp_slots_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    connection.query(sql, function(e, rows) {
        if (e) {
            logger.error('mysql getconnection on %s WaterTGPSlot getWater query %s', obj.acpid, String(e));
            callback(new Error('WaterTGPSlot1'), self.empty(gpname));
        } else {
            if (rows.length == 1 && !rows[0]['playerid']) rows = [];
            callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        }
    });
};

WaterTGPSlot.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterTGPSlot();

module.exports = w;
