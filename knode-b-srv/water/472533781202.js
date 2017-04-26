var logger = require('../util/log4js').getLogger('knbs');
var DbMgr = require('../comp/dbService');

function WaterPtRegular() {
	this.gpid = '472533781202';
}

WaterPtRegular.prototype.start = function(gp) {
	this.gp = gp;
};

WaterPtRegular.prototype.empty = function(gpname) {
	return {gpid: this.gpid, gpname: gpname, water: []};
};

WaterPtRegular.prototype.getWater = function(callback, obj, cond) { // realmoneybets
	var sql = 'select a.playerid,sum(a.betamount) as betamt from n1pt_regular_wagered_detail a';
	sql += ' where a.status=1 and a.playerid='+obj.uid+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterNew1PtRegular getWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('n1ptr'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNew1PtRegular getWater query %s', obj.acpid, String(e));
                    callback(new Error('n1ptr1'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['playerid']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPtRegular.prototype.getAgentWater = function(callback, obj, cond) {
	var sql = 'select a.agentcode,sum(a.betamount) as betamt from n1pt_regular_wagered_detail a';
	sql += ' where a.status=1 and a.agentcode='+obj.agentcode+' and a.gamedate>='+obj.sdate+' and a.gamedate<=' + obj.edate;
	if (cond.length) {
		sql += this.genCond(cond);
	}
	var self = this, gpname = obj._gpname;
    DbMgr.getConnection(obj.acpid, 2, function(err, ctype, connection) {
        if (err) {
            logger.error('mysql getconnection on %s WaterNew1PtRegular getAgentWater %s', obj.acpid, String(err));
            DbMgr.closeConn(ctype, connection);
            callback(new Error('n1ptra'), self.empty(gpname));
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNew1PtRegular getAgentWater query %s', obj.acpid, String(e));
                    callback(new Error('n1ptra2'), self.empty(gpname));
                } else {
                    if (rows.length == 1 && !rows[0]['agentcode']) rows = [];
                    callback(null, {gpid: self.gpid, rtype: 1, gpname: gpname, water: rows || []});
                }
            });
        }
    });
};

WaterPtRegular.prototype.genCond = function(cond) {
	return '';
};

var w = new WaterPtRegular();

module.exports = w;
