var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterSpon() {
	this.gpid = '8246252097638400';
}

WaterSpon.prototype.start = function(gp) {
	this.gp = gp;
};

WaterSpon.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterSpon.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.stake) as betamt from spon_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.transtime>='+obj.sdate+' and a.transtime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterSpon getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('spon'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterSpon getWater query %s', obj.acpid, String(e));
                    callback(new Error('spon1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterSpon.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.stake) as betamt from spon_wagered a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.transtime>='+obj.sdate+' and a.transtime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterSpon getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('spona'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterSpon getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('spona2'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterSpon.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterSpon();

module.exports = w;
