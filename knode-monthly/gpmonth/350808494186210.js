var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterBBINSport() {
	this.gpid = '350808494186210';
}

WaterBBINSport.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamount),sum(betamount+payoff),sum(betamount) from bbin_sport_wagered';
    sql += ' where result in("W","LW","LL","0","O", "L") and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterBBINSport getWater %s', acpid, String(err));
            callback(new Error('bbinsport'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterBBINSport getWater query %s', acpid, String(e));
                    callback(new Error('bbinsport1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterBBINSport();

module.exports = w;
