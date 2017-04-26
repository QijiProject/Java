var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterOeeBetSB() {
	this.gpid = '62207692669952';
}

WaterOeeBetSB.prototype.start = function(gp) {
	this.gp = gp;
};

WaterOeeBetSB.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterOeeBetSB.prototype.seDate = function(start, end) {
	var dt = new Date(start * 1000), s, e;
	var dt1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
	s = dt1.getTime() / 1000;
	dt = new Date(end * 1000);
	dt1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
	e = dt1.getTime() / 1000;
	return {s: s, e: e};
};

WaterOeeBetSB.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from oee_sportsbook_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.created>='+obj.sdate+' and a.created<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterOeeBetSB getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('sb'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterOeeBetSB getWater query %s', obj.acpid, String(e));
                    callback(new Error('sb1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterOeeBetSB.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.betamount) as betamt from oee_sportsbook_wagered a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.created>='+obj.sdate+' and a.created<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterOeeBetSB getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('sba'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterOeeBetSB getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('sba1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterOeeBetSB.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterOeeBetSB();

module.exports = w;
