var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterPtLd() {
	this.gpid = '420987656201';
}

WaterPtLd.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(winamount),sum(betamount) from npt_ld_wagered_detail';
    sql += ' where status=1 and gamedate>='+item.cstart+' and gamedate<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterNewPtLd getWater %s', acpid, String(err));
            callback(new Error('nptld'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterNewPtLd getWater query %s', acpid, String(e));
                    callback(new Error('nptld1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterPtLd();

module.exports = w;
