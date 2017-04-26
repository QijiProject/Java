var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterOeeBetLd() {
	this.gpid = '39500154618880';
}

WaterOeeBetLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterOeeBetLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterOeeBetLd.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,a.gametype,sum(a.betamt) as betamt from oee_ld_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.budatesettle>='+obj.sdate+' and a.budatesettle<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';

	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterOeeBetLd getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('ld'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterOeeBetLd getWater query %s', obj.acpid, String(e));
                    callback(new Error('ld1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterOeeBetLd.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.gametype,sum(a.betamt) as betamt from oee_ld_wagered a';
	sql += ' where a.agentcode='+obj.agentcode+' and a.status=1 and a.budatesettle>='+obj.sdate+' and a.budatesettle<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.gametype';
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterOeeBetLd getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('lda'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterOeeBetLd getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('lda1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['gametype']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterOeeBetLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterOeeBetLd();

module.exports = w;
