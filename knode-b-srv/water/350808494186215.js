var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterBBINHunter() {
    this.gpid = '350808494186215';
}

WaterBBINHunter.prototype.start = function(gp) {
    this.gp = gp;
};

WaterBBINHunter.prototype.empty = function(gpname) {
    return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterBBINHunter.prototype.getWater = function(callback, obj, cond) {
    var sql = 'select a.playerid,sum(a.commissionable) as betamt from bbin_hunter_wagered a';
    sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
    if (cond.length) {
        sql += this.genCond(cond);
    }
    var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterBBIN hunter getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('bbinhunter'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterBBIN hunter getWater query %s', obj.acpid, String(e));
                    callback(new Error('bbinhunter1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterBBINHunter.prototype.getAgentWater = function(callback, obj, cond) {
    var sql = 'select a.agentcode,sum(a.commissionable) as betamt from bbin_hunter_wagered a';
    sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.bettime>='+obj.sdate+' and a.bettime<=' + obj.edate;
    if (cond.length) {
        sql += this.genCond(cond);
    }
    var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterBBIN hunter getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('bbinhuntera'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterBBIN hunter getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('bbinhuntera1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterBBINHunter.prototype.genCond = function(cond) {
    return '';
};

var w = new WaterBBINHunter();

module.exports = w;
