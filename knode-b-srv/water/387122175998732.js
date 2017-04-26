var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterAgEg() {
	this.gpid = '387122175998732';
}

WaterAgEg.prototype.start = function(gp) {
	this.gp = gp;
};

WaterAgEg.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterAgEg.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,a.gametype,sum(a.validbetamount) as betamt from ag_eg_wagered a';
	sql += ' where a.status=1 and a.flag=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';

	var self = this, gpname = obj._gpname;

	DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s WaterAgEg getWater %s', obj.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			callback(new Error('ageg'), self.empty(gpname));
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s WaterAgEg getWater query %s', obj.acpid, String(e));
        			callback(new Error('ageg1'), self.empty(gpname));
        		} else {
        			if (rows.length == 1 && !rows[0]['playerid']) rows = [];
        			callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        		}
       		});
		}
	});
};

WaterAgEg.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.gametype,sum(a.validbetamount) as betamt from ag_eg_wagered a';
	sql += ' where a.agentcode='+obj.agentcode+' and a.status=1 and a.flag=1 and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';
	var self = this, gpname = obj._gpname;

	DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
		if (err) {
			logger.error('mysql getconnection on %s WaterAgEg getAgentWater %s', obj.acpid, String(err));
			DbMgr.closeConn(ctype, connection);
			callback(new Error('agega'), self.empty(gpname));
		} else {
			connection.query(sql, function(e, rows) {
				DbMgr.closeConn(ctype, connection);
        		if (e) {
        			logger.error('mysql getconnection on %s WaterAgEg getAgentWater query %s', obj.acpid, String(e));
        			callback(new Error('agega1'), self.empty(gpname));
        		} else {
        			if (rows.length == 1 && !rows[0]['gametype']) rows = [];
        			callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
        		}
       		});
		}
	});
};

WaterAgEg.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterAgEg();

module.exports = w;
