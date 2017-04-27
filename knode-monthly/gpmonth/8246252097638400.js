var logger = require('../util/log4js').getLogger('knmo');
var DbMgr = require('../comp/dbService');

function WaterSpon() {
	this.gpid = '8246252097638400';
}

WaterSpon.prototype.getWater = function(acpid, item, dt, callback) {
    var sql = 'insert into iplay_player_gp_monthly ('
    sql += 'select '+item.asmonth+','+this.gpid+',playerid,agentcode,'+dt+','+dt+',';
    sql += 'count(*),sum(stake),sum(stake+winlostamount),sum(stake) from spon_wagered';
    sql += ' where ticketstatus in("WON","LOSE","DRAW","Half WON","Half LOSE") and transtime>='+item.cstart+' and transtime<=' + item.cend;
    sql += ' group by playerid) on duplicate key update betcount=values(betcount),bettotal=values(bettotal),efftotal=values(efftotal),validbettotal=values(validbettotal),updated=values(updated)';

    DbMgr.getConnection(acpid, 2, function(err, ctype, connection) {
        if (err) {
            DbMgr.closeConn(ctype, connection);
            logger.error('mysql getconnection on %s WaterSpon getWater %s', acpid, String(err));
            callback(new Error('spon'), []);
        } else {
            connection.query(sql, function(e, rows) {
                DbMgr.closeConn(ctype, connection);
                if (e) {
                    logger.error('mysql getconnection on %s WaterSpon getWater query %s', acpid, String(e));
                    callback(new Error('spon1'), []);
                } else {
                    callback(null, rows);
                }
            });
        }
    });
};

var w = new WaterSpon();

module.exports = w;
