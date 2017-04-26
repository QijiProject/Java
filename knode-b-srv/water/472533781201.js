var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterPtLd() {
	this.gpid = '472533781201';
}

WaterPtLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterPtLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterPtLd.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamount) as betamt from n1pt_ld_wagered_detail a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterNew1PtLd getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('n1ptld'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNew1PtLd getWater query %s', obj.acpid, String(e));
                    callback(new Error('n1ptld1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPtLd.prototype.getAgentWater = function(callback, obj, cond) { // realmoneybets
	var sql = 'select a.agentcode,sum(a.betamount) as betamt from n1pt_ld_wagered_detail a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterNew1PtLd getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('n1ptlda'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNew1PtLd getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('n1ptlda2'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPtLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterPtLd();

module.exports = w;
