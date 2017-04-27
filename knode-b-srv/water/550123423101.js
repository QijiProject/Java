var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterIMOGGFish() {
	this.gpid = '550123423101';
}

WaterIMOGGFish.prototype.start = function(gp) {
	this.gp = gp;
};

WaterIMOGGFish.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterIMOGGFish.prototype.getWater = function(callback, obj, cond) {
	var sql = 'select a.playerid,sum(a.betamt) as betamt from imo_ggfish_wagered a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterIMOGGFish getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('WaterIMOGGFish'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterIMOGGFish getWater query %s', obj.acpid, String(e));
                    callback(new Error('WaterIMOGGFish1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterIMOGGFish.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.betamt) as betamt from imo_ggfish_wagered a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterIMOGGFish getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('WaterIMOGGFish'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterIMOGGFish getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('WaterIMOGGFish1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterIMOGGFish.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterIMOGGFish();

module.exports = w;
