var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterKeno() {
	this.gpid = '5707231341449216';
}

WaterKeno.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betmoney),sum(betwinning),sum(betmoney) from keno_wagered';
    sql += ' where betstatus="settled" and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterKeno getWater %s', acpid, String(err));
            callback(new Error('keno'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterKeno getWater query %s', acpid, String(e));
                    callback(new Error('keno1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterKeno();

module.exports = w;
