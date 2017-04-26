var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterAgHEg() {
	this.gpid = '387122175998733';
}

WaterAgHEg.prototype.start = function(gp) {
	this.gp = gp;
};

WaterAgHEg.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterAgHEg.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,a.gametype,sum(a.validbetamount) as betamt from ag_heg_wagered a';
	sql += ' where a.status=1 and a.flag=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';

	var self = this, gpname = obj._gpname;

	DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s WaterAgHEg getWater %s', obj.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			callback(new Error('agheg'), self.empty(gpname));
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s WaterAgHEg getWater query %s', obj.acpid, String(e));
        			callback(new Error('agheg1'), self.empty(gpname));
        		} else {
        			if (rows.length == 1 && !rows[0]['playerid']) rows = [];
        			callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        		}
       		});
		}
	});
};

WaterAgHEg.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.gametype,sum(a.validbetamount) as betamt from ag_heg_wagered a';
	sql += ' where a.agentcode='+obj.agentcode+' and a.status=1 and a.flag=1 and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';
	var self = this, gpname = obj._gpname;

	DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s WaterAgHEg getAgentWater %s', obj.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			callback(new Error('aghega'), self.empty(gpname));
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s WaterAgHEg getAgentWater query %s', obj.acpid, String(e));
        			callback(new Error('aghega1'), self.empty(gpname));
        		} else {
        			if (rows.length == 1 && !rows[0]['gametype']) rows = [];
        			callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        		}
       		});
		}
	});
};

WaterAgHEg.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterAgHEg();

module.exports = w;
