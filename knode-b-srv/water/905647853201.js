var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterEBet() {
	this.gpid = '905647853201';
}

WaterEBet.prototype.start = function(gp) {
	this.gp = gp;
};

WaterEBet.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterEBet.prototype.seDate = function(start, end) {
	var dt = new Date(start * 1000), s, e;
	var dt1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
	s = dt1.getTime() / 1000;
	dt = new Date(end * 1000);
	dt1 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
	e = dt1.getTime() / 1000;
	return {s: s, e: e};
};

WaterEBet.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from ebet_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterEBet getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('ebet'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterEBet getWater query %s', obj.acpid, String(e));
                    callback(new Error('ebet1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterEBet.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.betamount) as betamt from ebet_wagered a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterEBet getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('ebeta'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterEBet getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('ebeta1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterEBet.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterEBet();

module.exports = w;
