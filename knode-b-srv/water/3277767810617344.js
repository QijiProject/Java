var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterGdLd() {
	this.gpid = '3277767810617344';
}

WaterGdLd.prototype.start = function(gp) {
	this.gp = gp;
};

WaterGdLd.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterGdLd.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,a.productid,sum(a.betamount) as betamt from gd_ld_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.productid';

	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterGdLd getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('gd'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterGdLd getWater query %s', obj.acpid, String(e));
                    callback(new Error('gd1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterGdLd.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.productid,sum(a.betamount) as betamt from gd_ld_wagered a';
	sql += ' where a.agentcode='+obj.agentcode+' and a.status=1 and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	sql += ' group by a.productid';
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterGdLd getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('gda'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterGdLd getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('gda1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['gametype']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterGdLd.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterGdLd();

module.exports = w;
