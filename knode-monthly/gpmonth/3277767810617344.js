var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterGdLd() {
	this.gpid = '3277767810617344';
}

WaterGdLd.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(winloss),sum(betamount) from gd_ld_wagered';
    sql += ' where betresult in("Win","Loss","Tie") and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterGdLd getWater %s', acpid, String(err));
            callback(new Error('gd'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterGdLd getWater query %s', acpid, String(e));
                    callback(new Error('gd1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterGdLd();

module.exports = w;
