var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterMG() {
	this.gpid = '11964220589608960';
}

WaterMG.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamt),sum(betreturnamt),sum(betamt) from mg_game_wagered';
    sql += ' where transtype in("mgsaspibet","mgsapiwin") and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterMG getWater %s', acpid, String(err));
            callback(new Error('mg'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterMG getWater query %s', acpid, String(e));
                    callback(new Error('mg1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterMG();

module.exports = w;
