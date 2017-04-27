var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterOeeBetSB() {
	this.gpid = '62207692669952';
}

WaterOeeBetSB.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(betamount+winlossamount),sum(betamount) from oee_sportsbook_wagered';
    sql += ' where betstatus=401 and settlementstatus=433 and created>='+item.cstart+' and created<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterOeeBetSB getWater %s', acpid, String(err));
            callback(new Error('oeesb'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterOeeBetSB getWater query %s', acpid, String(e));
                    callback(new Error('oeesb1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterOeeBetSB();

module.exports = w;
