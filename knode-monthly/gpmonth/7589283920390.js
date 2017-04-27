var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterSgWin() {
	this.gpid = '7589283920390';
}

WaterSgWin.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(totalbetamt),sum(totalbetamt+dividend),sum(totalbetamt) from sgwin_wagered';
    sql += ' where settled=1 and tesing=0 and bettime>='+item.cstart+' and bettime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterSgWin getWater %s', acpid, String(err));
            callback(new Error('sgwin'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterSgWin getWater query %s', acpid, String(e));
                    callback(new Error('sgwin1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterSgWin();

module.exports = w;
