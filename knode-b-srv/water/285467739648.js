var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterPL() {
	this.gpid = '285467739648';
}

WaterPL.prototype.start = function(gp) {
	this.gp = gp;
};

WaterPL.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterPL.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from pl_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterPL getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('pl'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterPL getWater query %s', obj.acpid, String(e));
                    callback(new Error('pl1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPL.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.betamount) as betamt from pl_wagered a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterPL getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('pla'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterPL getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('pla2'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPL.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterPL();

module.exports = w;
