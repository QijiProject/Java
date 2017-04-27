var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterTGPLd() {
	this.gpid = '773562192801';
}

WaterTGPLd.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(betamt),sum(winamt),sum(betamt) from tgp_ld_wagered';
    sql += ' where betstatus=1 and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterTGPLd getWater %s', acpid, String(err));
            callback(new Error('WaterTGPLd'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterTGPLd getWater query %s', acpid, String(e));
                    callback(new Error('WaterTGPLd1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterTGPLd();

module.exports = w;
